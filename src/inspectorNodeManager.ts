import { buildPreview } from "./buildPreview";
import { symbols } from "./symbols";
import { NodeOptions, NodeExpandOptions } from "./types";
import { InspectorNode } from "./inspectorNode";
import { extractKeys, getType, isElement, isExpandable } from "./utils";

export class InspectorNodeManager {
    nextId: number;
    nodeMap: Map<number, InspectorNode>;
    dirtyNodes: number[];
    root: any;
    visibleNodes: InspectorNode[] = [];
    visibleNodeIndex = new Map<InspectorNode, number>();
    alive = true;
    maxWidth = 0;

    constructor(rootValue: any) {
        this.nextId = 0;
        this.nodeMap = new Map();
        this.dirtyNodes = [];

        this.root = this.createNode({
            value: rootValue
        });

        this.buildVisibleNodes(this.root);
        this.updateVisibleNodeIndex();
    }
    allocateId() {
        return this.nextId++;
    }
    updateContentWidth(node: InspectorNode, width: number) {
        node.contentWidth = width;
        node.widthDirty = false;

        if (width >= this.maxWidth) {
            this.maxWidth = width;

        }
    }
    markWidthDirty(node: InspectorNode) {
        if (node.widthDirty) return;
        node.widthDirty = true;
        this.dirtyNodes.push(node.id);
    }
    recalculateMaxWidth() {
        let maxWidth = 0;
        for (const node of this.visibleNodes) {
            if (node.contentWidth > maxWidth) {
                maxWidth = node.contentWidth;
            }
        }
        this.maxWidth = maxWidth;
    }
    createNode({
        parent,
        key,
        value,
        valueGetter,
        preview,
        previewText,
        flags = [],
        target,
        attachment = null
    }: NodeOptions): InspectorNode {
        const node = new InspectorNode(this.allocateId(), { parent, key, value, valueGetter, preview, previewText, flags, target, attachment });

        node.contentWidth = 0;
        node.path = this.getNodePath(node);

        this.nodeMap.set(node.id, node);
        this.markWidthDirty(node);

        return node;
    }
    accessNodeGetter(node: InspectorNode) {
        if (!node.valueGetter) return;
        try {
            node.value = node.valueGetter();
            node.valueType = getType(node.value);
            node.hasChildren = isExpandable(node.value);
            if (!(node.valueType.includes('Element') && !isElement(node.value))) {
                node.target = node.value;
            }

            if (node.flags.includes('prototype')) {
                node.preview = buildPreview(node.value, {
                    detail: false
                })
                node.previewText = buildPreview(node.value, {
                    detail: false,
                    type: 'plaintext'
                })
            } else {
                node.preview = buildPreview(node.value);
                node.previewText = buildPreview(node.value, { type: 'plaintext' });
            }
        } catch (e) {
            node.value = `[Exception: ${e}]`;
            node.valueType = 'string';
            node.hasChildren = false;
            node.flags.push('plaintext');
            node.preview = node.value;
            node.previewText = node.value;
        }

        this.markWidthDirty(node);
    }
    expandNode(node: InspectorNode, options: NodeExpandOptions = {
        prototype: true,
        symbols: true
    }) {
        if (!this.alive) return false;
        if (node.parent && !this.checkParentExpanded(node)) return false;

        let expandQueue: InspectorNode[] = [];

        if (!node.childrenLoaded) {
            const type = getType(node.value);
            const originalType = node.attachment?.originalType;

            if (
                type === 'Array' &&
                !node.flags.includes('[[prototype]]')
            ) {
                this.handleLargeArray(node, node.value, originalType || 'Array', options);
            } else if (node.attachment && node.flags.includes('chunk')) {
                this.handleLargeArray(node, node.value, originalType || 'Array', options);
            } else if (
                (type === 'Map' || type === "Set") &&
                !node.flags.includes('[[prototype]]')
            ) {
                const arr = [...node.value.keys().map((key: any, i: number) => {
                    const value = type === 'Map' ? node.value.get(key) : key;
                    return type === 'Map' ? { key, value } : { value };
                })]
                const child = this.createNode({
                    parent: node,
                    key: '[[Entries]]',
                    value: arr,
                    preview: '',
                    previewText: '',
                    flags: ['[[entries]]'],
                    attachment: {
                        originalType: type
                    }
                })
                node.children.push(child);
                expandQueue.push(child);
            } else {
                const commonKeys = Object.keys(node.value).sort();
                const propertyKeys = Object.getOwnPropertyNames(node.value).filter(t => !commonKeys.includes(t)).sort();
                const symbolKeys = Object.getOwnPropertySymbols(node.value);

                const commons = extractKeys(node.value, [...commonKeys, ...symbolKeys]);
                const properties = extractKeys(node.value, propertyKeys);

                this.createNodes(node, commons.common, ['common']);
                this.createNodes(node, properties.common, ['property']);
                this.createNodes(node, commons.accessors.concat(properties.accessors), ['property', 'accessors']);
            }

            const __proto__ = node.value.__proto__ || Object.getPrototypeOf(node.value);

            if (
                __proto__ &&
                !node.flags.includes('dummy-object') &&
                !node.flags.includes('[[entries]]') &&
                !node.flags.includes('chunk') &&
                options.prototype === true
            ) {
                let preview;
                let previewText;
                if (type.includes('Element')) {
                    preview = getType(__proto__);
                    previewText = preview;
                } else {
                    preview = buildPreview(__proto__, {
                        detail: false
                    });
                    previewText = buildPreview(__proto__, {
                        detail: false,
                        type: 'plaintext'
                    });
                }
                const child = this.createNode({
                    parent: node,
                    key: '[[Prototype]]',
                    value: __proto__,
                    flags: ['[[prototype]]'],
                    target: (type.includes('Element')) ? node.target : node.value,
                    preview: preview,
                    previewText: previewText
                })
                node.children.push(child);
            }
            node.childrenLoaded = true;
        }

        node.expanded = true;
        this.updateVisibleSize(node);
        this.visibleNodes = [];
        this.buildVisibleNodes(this.root);
        this.updateVisibleNodeIndex();

        for (const item of expandQueue) {
            this.expandNode(item);
        }

        this.recalculateMaxWidth();

        return true;
    }
    collapseNode(node: InspectorNode) {
        if (node.valueGetter) {
            this.removeChildren(node);
            node.childrenLoaded = false;
            node.children = [];
        }

        for (const child of node.children) {
            if (child.valueGetter) {
                if (child.hasChildren && child.childrenLoaded) {
                    this.removeChildren(child);
                }
                child.children = [];
                child.childrenLoaded = false;
                child.hasChildren = false;
                child.value = '(...)';
                child.valueType = 'string';
                child.preview = child.value;
                child.previewText = child.value;
                child.expanded = false;
            }
        }

        node.expanded = false;
        this.updateVisibleSize(node);
        this.visibleNodes = [];
        this.buildVisibleNodes(this.root);
        this.updateVisibleNodeIndex();
        this.recalculateMaxWidth();
    }
    destroyNode(node: InspectorNode, self = true) {
        for (const child of node.children) {
            this.destroyNode(child);
        }
        node.children.length = 0;
        node.setVisibleSize(1);

        if (self) {
            this.nodeMap.delete(node.id);
            if (node.contentWidth === this.maxWidth) {
                this.recalculateMaxWidth();
            }
            if (node.parent) {
                const index = node.parent.children.indexOf(node);
                if (index !== -1) {
                    node.parent.children.splice(index, 1);
                }
                node.parent = undefined;
            }
            node.dispose();
        }
    }
    private createNodes(node: InspectorNode, keys: PropertyKey[], type: string[]) {
        if (!this.alive) return;

        keys.forEach(key => {
            const datas = [];
            if (type.includes('accessors')) {
                const desc = Object.getOwnPropertyDescriptor(node.value, key);
                const getter = desc && desc.get;
                const setter = desc && desc.set;
                const isSymbol = typeof key === 'symbol';
                if (getter) {
                    datas.push({
                        key: 'get ' + String(key),
                        type: 'getterFunc',
                        value: getter,
                        isSymbol
                    })
                }
                if (setter) {
                    datas.push({
                        key: 'set ' + String(key),
                        type: 'setterFunc',
                        value: setter,
                        isSymbol
                    })
                }
            } else {
                const desc = Object.getOwnPropertyDescriptor(node.value, key);
                const isSymbol = typeof key === 'symbol';

                try {
                    if (desc && desc.get) {
                        datas.push({
                            key: String(key),
                            type: 'getter',
                            value: '(...)',
                            getter: () => {
                                return Reflect.get(node.value, key, node.target || node.value);
                            },
                            isSymbol
                        })
                    } else {
                        datas.push({
                            key: String(key),
                            type: 'common',
                            value: node.value[key],
                            isSymbol
                        })
                    }
                } catch (e) {
                    datas.push({
                        key: String(key),
                        type: 'plaintext',
                        value: `[${e}]`,
                        isSymbol
                    })
                }
            }

            let flags = [];
            if (node.flags.includes('[[prototype]]'))
                flags.push('prototype');
            if (type.includes('property'))
                flags.push('property');

            datas.forEach(data => {
                let childFlags = [...flags];
                if (data.type === 'getter') {
                    childFlags.push('plaintext');
                    childFlags.push('getter');
                }

                if (data.type === 'plaintext')
                    childFlags.push('plaintext');

                if (data.isSymbol) {
                    childFlags.push('symbol');
                }

                const child = this.createNode({
                    parent: node,
                    key: data.key,
                    value: data.value,
                    flags: childFlags,
                    preview: childFlags.includes('plaintext') && data.value,
                    previewText: childFlags.includes('plaintext') && data.value,
                    target: data.value,
                    valueGetter: data.getter
                })
                node.children.push(child);
            })
        })
    }
    destroy() {
        this.alive = false;
        this.destroyNode(this.root);
        this.root = null;
        this.visibleNodes.length = 0;
        this.nodeMap.clear();
    }
    getNodePath(node: InspectorNode): string {
        let path = node.parent?.path || '';

        if (node.parent?.flags.includes('[[prototype]]')) return String(node.key);

        if (
            node.parent?.flags.includes('dummy-object') ||
            node.flags.includes('dummy-object') ||
            node.flags.includes('chunk') ||
            node.level === 0
        ) return path;

        if (node.parent?.valueType === 'Array') {
            path += `[${node.key}]`;
        } else if (node.flags.includes('symbol')) {
            path += `["${String(node.key)}"]`;
        } else {
            path += path ? `.${node.key}` : String(node.key);
        }

        return path;
    }
    handleLargeArray(node: InspectorNode, valueRef: any, originalType: string, options: NodeExpandOptions) {
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
                } : {
                    parent: node,
                    value: value,
                    previewText: `[${range[0]} ${symbols.ellipsis} ${range[1]}]`,
                    flags: ['chunk'],
                    attachment: {
                        parentLevels: levels,
                        startIndex: range[0],
                        originalType: originalType
                    }
                })
                node.children.push(child);
            }
        } else {
            for (let i = 0; i < len; i++) {
                const key = String(start ? start + i : i);
                const value = valueRef[i];
                const childNodeData: NodeOptions = {
                    parent: node,
                    key: key,
                    value: value,
                    flags: []
                }

                if (originalType === 'Map') {
                    childNodeData.previewText = `{${buildPreview(value.key, {
                        type: 'plaintext'
                    })} => ${buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'plaintext'
                    })}}`
                    childNodeData.flags = ['dummy-object']
                }
                if (originalType === 'Set') {
                    childNodeData.previewText = buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'plaintext'
                    });
                    childNodeData.flags = ['dummy-object']
                }

                const child = this.createNode(childNodeData);
                node.children.push(child);
            }
        }
    }
    updateVisibleSize(node: InspectorNode) {
        let current: InspectorNode | undefined = node;

        while (current != undefined) {
            const size = current.calculateVisibleSize();
            current.setVisibleSize(size);
            current = current.parent;
        }
    }
    async expandNodeRecursively(node: InspectorNode): Promise<boolean> {
        if (!this.alive) return false;

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
                    const result = this.expandNode(node);
                    if (result === false) {
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
    checkParentExpanded(node: InspectorNode): boolean {
        return node.parent ? node.parent.expanded && this.checkParentExpanded(node.parent) : true;
    }
    findChildrenSize(node: InspectorNode) {
        if (!node.hasChildren || !node.childrenLoaded || !node.expanded) return 0;

        let size = 0;
        for (const child of node.children) {
            size += this.findChildrenSize(child) + 1;
        }

        return size;
    }
    removeNode(node: InspectorNode) {
        this.destroyNode(node);
        this.visibleNodes = [];
        this.buildVisibleNodes(this.root);
        this.updateVisibleNodeIndex();
    }
    removeChildren(node: InspectorNode) {
        this.destroyNode(node, false);
        this.visibleNodes = [];
        this.buildVisibleNodes(this.root);
        this.updateVisibleNodeIndex();
    }
    buildVisibleNodes(node: InspectorNode) {
        this.visibleNodes.push(node);
        if (node.expanded && node.childrenLoaded && node.children) {
            for (const child of node.children) {
                this.buildVisibleNodes(child);
            }
        }
    }
    updateVisibleNodeIndex() {
        this.visibleNodeIndex.clear();
        for (let i = 0; i < this.visibleNodes.length; i++) {
            this.visibleNodeIndex.set(this.visibleNodes[i], i);
        }
    }
}

