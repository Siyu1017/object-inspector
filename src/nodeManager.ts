import { buildPreview } from "./buildPreview";
import { symbols } from "./symbols";
import { Node, NodeData, NodeExpandOptions } from "./types";
import { extractKeys, getType, isElement, isExpandable, safeString } from "./utils";

export class NodeManager {
    nextId: number;
    nodeMap: Map<number, any>;
    root: any;
    visibleNodes: Node[];

    constructor(rootValue: any) {
        this.nextId = 0;
        this.nodeMap = new Map();

        this.root = this.createNode({
            value: rootValue
        });

        this.visibleNodes = [];
        this._buildVisibleNodes(this.root);
    }
    destroy() {
        this.visibleNodes = [];
        this.removeNode(this.root);
    }
    getNodePath(node: Node): string {
        let path = node.parent?.path || '';

        if (node.parent?.type.includes('[[prototype]]')) return String(node.key);

        if (
            node.parent?.type.includes('dummy-object') ||
            node.type.includes('dummy-object') ||
            node.type.includes('chunk') ||
            node.level === 0
        ) return path;

        if (node.parent?.valueType === 'Array') {
            path += `[${node.key}]`;
        } else if (node.type.includes('symbol')) {
            path += `["${String(node.key)}"]`;
        } else {
            path += path ? `.${node.key}` : String(node.key);
        }

        return path;
    }
    handleLargeArray(node: Node, valueRef: any, originalType: string, options: NodeExpandOptions) {
        const { parentLevels, startIndex } = node.attachment || {};
        const len = valueRef.length;
        const start = startIndex || 0;

        if (len > 100 || parentLevels > 1 && len == 100) {
            const levels = parentLevels ? parentLevels - 1 : ~~(Math.log10(len - 1) / 2);
            const chunkSize = Math.pow(100, levels);
            const n = len / chunkSize;

            for (let i = 0; i < n; i++) {
                let value = valueRef.slice(i * chunkSize, (i + 1) * chunkSize);
                let range = [start + i * chunkSize, start + (i + 1) * chunkSize - 1];

                if (range[1] > len - 1 && start == 0) {
                    range[1] = len - 1;
                }
                if (range[0] == range[1]) {
                    value = value[0];
                }

                const child = this.createNode(range[0] == range[1] ? {
                    parent: node,
                    key: String(range[0]),
                    value: value,
                    preview: buildPreview(value)
                } : {
                    parent: node,
                    value: value,
                    preview: `[${range[0]} ${symbols.ellipsis} ${range[1]}]`,
                    type: ['chunk'],
                    attachment: {
                        parentLevels: levels,
                        startIndex: range[0]
                    },
                    originalType: originalType
                })
                node.children.push(child);
            }
        } else {
            for (let i = 0; i < len; i++) {
                const key = String(start ? start + i : i);
                const value = valueRef[i];
                const childNodeData: NodeData = {
                    parent: node,
                    key: key,
                    value: value,
                    preview: buildPreview(value),
                    type: []
                }

                if (originalType === 'Map') {
                    childNodeData.preview = `{${buildPreview(value.key, {
                        type: 'styleless'
                    })} => ${buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'styleless'
                    })}}`
                    childNodeData.type = ['dummy-object']
                }
                if (originalType === 'Set') {
                    childNodeData.preview = buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'styleless'
                    });
                    childNodeData.type = ['dummy-object']
                }

                const child = this.createNode(childNodeData);
                node.children.push(child);
            }
        }
    }
    createNode({
        parent,
        key,
        value,
        valueGetter,
        preview,
        type = 'normal',
        originalType,
        self,
        attachment = null
    }: NodeData) {
        const valueType = getType(value);
        try {
            if (typeof preview !== 'string') {
                preview = buildPreview(value, {
                    self: valueType.includes('Element') ? self : null
                })
            }
        } catch (e) {
            preview = `[Exception: ${e}]`;
        }

        const id = this.nextId++
        const listeners = new Map();
        const node: Node = new Proxy({
            id: id,
            parent: parent,
            level: parent?.level + 1 || 0,
            key: key,
            valueRef: value,
            valueType: valueType,
            valueGetter: valueGetter || null,
            hasChildren: isExpandable(value),
            childrenLoaded: false,
            children: [],
            expanded: false,
            visibleSize: 1,
            preview: preview,
            width: 0,
            type: typeof type === 'string' ? [type] : Array.isArray(type) ? type : ['normal'],
            on: (event: string, callback: () => void) => {
                if (!listeners.has(event))
                    listeners.set(event, []);
                listeners.get(event).push(callback);
            },
            self: self || null,
            attachment: attachment || null
        }, {
            set: (target, key, value) => {
                if (key === 'visibleSize' && value < 1)
                    throw new Error('visibleSize must be a positive integer');
                (target as any)[key] = value;
                if (key !== 'width') {
                    // ignore width changes to avoid infinite loop when rendering
                    listeners.get('visibleSizeChange')?.forEach((callback: () => void) => callback());
                }
                return true;
            }
        });

        node.path = this.getNodePath(node);
        node.accessGetter = () => {
            if (!node.valueGetter) return;
            try {
                node.valueRef = node.valueGetter();
                node.valueType = getType(node.valueRef);
                node.hasChildren = isExpandable(node.valueRef);
                if (!(node.valueType.includes('Element') && !isElement(node.valueRef))) {
                    node.self = node.valueRef;
                }

                if (node.type?.includes('prototype')) {
                    node.preview = buildPreview(node.valueRef, {
                        detail: false
                    })
                } else {
                    node.preview = buildPreview(node.valueRef);
                }
            } catch (e) {
                node.valueRef = `[Exception: ${e}]`;
                node.valueType = 'string';
                node.hasChildren = false;
                node.type?.push('styleless');
                node.preview = node.valueRef;
            }
        }
        node.increaseVisibleSize = (size: number) => {
            node.visibleSize += size;
            node.parent?.increaseVisibleSize?.(size);
        }
        node.decreaseVisibleSize = (size: number) => {
            node.visibleSize -= size;
            node.parent?.decreaseVisibleSize?.(size);
        }

        const createNodes = (data: any, keys: any[], nodeType: string[], self: any) => {
            keys.forEach(k => {
                const datas = [];
                if (nodeType.includes('accessors')) {
                    const desc = Object.getOwnPropertyDescriptor(data, k);
                    const getter = desc && desc.get;
                    const setter = desc && desc.set;
                    const isSymbol = typeof k === 'symbol';
                    if (getter) {
                        datas.push({
                            key: 'get ' + String(k),
                            type: 'getterFunc',
                            value: getter,
                            isSymbol
                        })
                    }
                    if (setter) {
                        datas.push({
                            key: 'set ' + String(k),
                            type: 'setterFunc',
                            value: setter,
                            isSymbol
                        })
                    }
                } else {
                    const desc = Object.getOwnPropertyDescriptor(data, k);
                    const isSymbol = typeof k === 'symbol';

                    try {
                        if (desc && desc.get) {
                            datas.push({
                                key: String(k),
                                type: 'getter',
                                value: '(...)',
                                getter: () => {
                                    return Reflect.get(data, k, self);
                                },
                                isSymbol
                            })
                        } else {
                            datas.push({
                                key: String(k),
                                type: 'common',
                                value: data[k],
                                isSymbol
                            })
                        }
                    } catch (e) {
                        datas.push({
                            key: String(k),
                            type: 'plaintext',
                            value: `[${e}]`,
                            isSymbol
                        })
                    }
                }

                let types = [];
                if (node.type.includes('[[prototype]]'))
                    types.push('prototype');
                if (nodeType.includes('property'))
                    types.push('property');

                datas.forEach(data => {
                    let childType = [...types];
                    if (data.type === 'getter') {
                        childType.push('styleless');
                        childType.push('getter');
                    }

                    if (data.type === 'plaintext')
                        childType.push('styleless');

                    if (data.isSymbol) {
                        childType.push('symbol');
                    }

                    const child = this.createNode({
                        parent: node,
                        key: data.key,
                        value: data.value,
                        type: childType,
                        preview: childType.includes('styleless') ? data.value : null,
                        self: data.value,
                        valueGetter: data.getter
                    })
                    node.children.push(child);
                })
            })
        }

        node.expand = (options: NodeExpandOptions = {
            prototype: true,
            symbols: true
        }) => {
            if (node.parent && !this.checkParentExpanded(node)) return false;

            let expandQueue: Node[] = [];

            if (!node.childrenLoaded) {
                const type = getType(node.valueRef);

                if (
                    type === 'Array' &&
                    !node.type.includes('[[prototype]]')
                ) {
                    this.handleLargeArray(node, node.valueRef, originalType || 'Array', options);
                } else if (node.attachment && node.type.includes('chunk')) {
                    this.handleLargeArray(node, node.valueRef, originalType || 'Array', options);
                } else if (
                    (type === 'Map' || type === "Set") &&
                    !node.type.includes('[[prototype]]')
                ) {
                    const arr = [...node.valueRef.keys().map((key: any, i: number) => {
                        const value = type === 'Map' ? node.valueRef.get(key) : key;
                        return type === 'Map' ? { key, value } : { value };
                    })]
                    const child = this.createNode({
                        parent: node,
                        key: '[[Entries]]',
                        value: arr,
                        preview: '',
                        type: ['[[entries]]'],
                        originalType: type
                    })
                    node.children.push(child);
                    expandQueue.push(child);

                    /*
                    node.valueRef.keys().forEach((key: any, i: number) => {
                        const value = type === 'Map' ? node.valueRef.get(key) : key;
                        const childValue = type === 'Map' ? { key, value } : { value };
                        const childPreview = buildPreview(value, {
                            detail: false,
                            depth: 1,
                            type: 'styleless'
                        });
                        const child = this.createNode({
                            parent: node,
                            key: String(i),
                            value: childValue,
                            preview: type === 'Map' ? `{\"${safeString(key)}\" => ${childPreview}}` : childPreview,
                            type: ['dummy-object']
                        })
                        node.children.push(child);
                    })*/
                } else {
                    const commonKeys = Object.keys(node.valueRef).sort();
                    const propertyKeys = Object.getOwnPropertyNames(node.valueRef).filter(t => !commonKeys.includes(t)).sort();
                    const symbolKeys = Object.getOwnPropertySymbols(node.valueRef);

                    const commons = extractKeys(node.valueRef, [...commonKeys, ...symbolKeys]);
                    const properties = extractKeys(node.valueRef, propertyKeys);

                    createNodes(node.valueRef, commons.common, ['common'], node.self || node.valueRef);
                    createNodes(node.valueRef, properties.common, ['property'], node.self || node.valueRef);
                    createNodes(node.valueRef, commons.accessors.concat(properties.accessors), ['property', 'accessors'], node.self || node.valueRef);
                }

                const __proto__ = node.valueRef.__proto__ || Object.getPrototypeOf(node.valueRef);

                if (
                    __proto__ &&
                    !node.type.includes('dummy-object') &&
                    !node.type.includes('[[entries]]') &&
                    !node.type.includes('chunk') &&
                    options.prototype === true
                ) {
                    let preview;
                    if (type.includes('Element')) {
                        preview = getType(__proto__);
                    } else {
                        preview = buildPreview(__proto__, {
                            detail: false
                        });
                    }
                    const child = this.createNode({
                        parent: node,
                        key: '[[Prototype]]',
                        value: __proto__,
                        type: ['[[prototype]]'],
                        self: (type.includes('Element')) ? node.self : node.valueRef,
                        preview: preview
                    })
                    node.children.push(child);
                }

                node.childrenLoaded = true;
            }

            node.expanded = true;

            const childrenSize = this.findChildrenSize(node);
            node.visibleSize = childrenSize + 1;
            node.parent?.increaseVisibleSize?.(childrenSize);

            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);

            for (const item of expandQueue) {
                item.expand?.();
            }

            return true;
        }

        node.collapse = () => {
            const visibleSize = node.visibleSize;

            if (node.valueGetter) {
                this.removeChildren(node);
                node.childrenLoaded = false;
                node.children = [];
            }

            for (const child of node.children) {
                if (child.valueGetter) {
                    if (child.hasChildren && child.childTypeLoaded) {
                        this.removeChildren(child);
                    }
                    child.children = [];
                    child.childrenLoaded = false;
                    child.hasChildren = false;
                    child.valueRef = '(...)';
                    child.valueType = 'string';
                    child.preview = child.valueRef;
                    child.visibleSize = 1;
                    child.expanded = false;
                }
            }

            node.expanded = false;
            node.parent?.decreaseVisibleSize?.(visibleSize - 1);
            node.visibleSize = 1;

            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);
        }

        node.destroy = (self = true) => {
            if (node.hasChildren) {
                for (const child of node.children) {
                    child.destroy?.();
                }
            }
            node.visibleSize = 1;

            if (self == true) {
                this.nodeMap.delete(node.id);
                listeners.clear();
                Object.keys(node).forEach(key => {
                    delete (node as any)[key];
                })
            }
        }

        this.nodeMap.set(id, node);

        return node;
    }
    async expandNodeRecursively(node: Node): Promise<boolean> {
        try {
            if (node.valueGetter) {
                // not expanding nodes with valueGetter to avoid potential infinite loops or side effects
                return true;
            }
            if (!node.hasChildren) return true;
        } catch (e) { };

        try {
            await new Promise<void>(async (resolve, reject) => {
                requestAnimationFrame(() => {
                    const result = node.expand?.();
                    if (node.expand && result === false) {
                        return reject();
                    }
                    resolve();
                });
            })
        } catch (e) {
            return false;
        }

        for (const child of node.children) {
            if (child.key === '[[Prototype]]' || child.key === 'prototype') continue;
            if (!await this.expandNodeRecursively(child)) {
                // failed to expand child node, stop expanding further
                return false;
            }
        }

        return true;
    }
    checkParentExpanded(node: Node): boolean {
        return node.parent ? node.parent.expanded && this.checkParentExpanded(node.parent) : true;
    }
    findNodeAtIndex(index: number) {
        function traverse(node: any, index: number) {
            if (index === 0) return node;
            index--;

            if (node.expanded && node.childrenLoaded && node.children) {
                for (const child of node.children) {
                    if (index < child.visibleSize) {
                        return traverse(child, index);
                    }
                    index -= child.visibleSize;
                }
            }

            return null;
        }

        return traverse(this.root, index);
    }
    findChildrenSize(node: Node) {
        if (!node.hasChildren || !node.childrenLoaded || !node.expanded) return 0;

        let size = 0;
        for (const child of node.children) {
            size += this.findChildrenSize(child) + 1;
        }

        return size;
    }
    removeNode(node: Node) {
        node.destroy?.();
        this.visibleNodes = [];
        this._buildVisibleNodes(this.root);
    }
    removeChildren(node: Node) {
        node.destroy?.(false);
        this.visibleNodes = [];
        this._buildVisibleNodes(this.root);
    }
    _buildVisibleNodes(node: Node) {
        this.visibleNodes.push(node);
        if (node.expanded && node.childrenLoaded && node.children) {
            for (const child of node.children) {
                this._buildVisibleNodes(child);
            }
        }
    }
}
