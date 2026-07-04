/*!
 * object-inspector v1.1.1
 * Copyright (c) Siyu1017 2026
 */
const __VERSION__ = '1.1.1';

function getType(obj) {
    return {}.toString.call(obj).slice(8, -1);
}
function isExpandable(value) {
    if (value === null)
        return false;
    const t = typeof value;
    if (t !== "object" && t !== "function")
        return false;
    return true;
}
function isElement(obj) {
    try {
        return obj instanceof Element;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}
function safeEscape(html) {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function functionToCode(fn) {
    try {
        return Function.prototype.toString.call(fn);
    }
    catch (e) { }
    try {
        return fn + '';
    }
    catch (e) { }
    return '';
}
function safeString(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return safeEscape(str);
}
/**
 * Based on implementation from:
 * https://github.com/angus-c/just/blob/master/packages/collection-clone/
 *
 * Original author: Angus Croll
 * License: MIT
 */
function clone(obj) {
    const seen = new WeakSet();
    function _clone(obj) {
        let result = obj;
        const type = getType(obj);
        if (type == 'Set') {
            return new Set([...obj].map(value => _clone(value)));
        }
        if (type == 'Map') {
            return new Map([...obj].map(kv => [_clone(kv[0]), _clone(kv[1])]));
        }
        if (type == 'Date') {
            return new Date(obj.getTime());
        }
        if (type == 'RegExp') {
            return RegExp(obj.source, getRegExpFlags(obj));
        }
        if (type == 'Array' || type == 'Object') {
            // circular references detection
            if (seen.has(obj))
                return obj;
            seen.add(obj);
            result = Array.isArray(obj) ? [] : {};
            if (type === 'Array') {
                for (const key in obj) {
                    // include prototype properties
                    result[key] = _clone(obj[key]);
                }
            }
            else {
                for (const key of Reflect.ownKeys(obj)) {
                    result[key] = _clone(obj[key]);
                }
            }
        }
        // primitives and non-supported objects (e.g. functions) land here
        return result;
    }
    return _clone(obj);
}
function getRegExpFlags(regExp) {
    const flags = [];
    regExp.global && flags.push('g');
    regExp.ignoreCase && flags.push('i');
    regExp.multiline && flags.push('m');
    regExp.sticky && flags.push('y');
    regExp.unicode && flags.push('u');
    return flags.join('');
}
function throttle(fn, delay) {
    let previousTime = 0;
    return function (...args) {
        const nowTime = Date.now();
        if (nowTime - previousTime >= delay) {
            previousTime = nowTime;
            return fn.apply(this, args);
        }
    };
}
function extractKeys(self, keys) {
    const result = [];
    const accessors = [];
    keys.forEach(k => {
        const desc = Object.getOwnPropertyDescriptor(self, k);
        const hasGetter = desc && desc.get;
        const hasSetter = desc && desc.set;
        result.push(k);
        if (hasGetter || hasSetter)
            accessors.push(k);
    });
    return {
        common: result,
        accessors: accessors
    };
}
class EventEmitter {
    listeners = new Map();
    constructor() { }
    on(eventName, handler) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(handler);
    }
    off(eventName, handler) {
        if (!this.listeners.has(eventName))
            return;
        const index = this.listeners.get(eventName).indexOf(handler);
        if (index === -1)
            return;
        this.listeners.get(eventName).splice(index, 1);
    }
    once(eventName, handler) {
        const onceHandler = (...args) => {
            this.off(eventName, onceHandler);
            handler(...args);
        };
        this.on(eventName, onceHandler);
    }
    emit(eventName, ...args) {
        const handlers = this.listeners.get(eventName);
        if (handlers) {
            for (const fn of handlers.slice()) {
                try {
                    fn(...args);
                }
                catch (e) {
                    console.error(`Error in handler for ${eventName}:`, e);
                }
            }
        }
    }
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$1 = ".index-module_inspector__q3168{--bg:#1e1e1e;--color:#e3e3e3;--hover-bg:#33373f;--key-color:#8eacf2;--expand-icon:url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='14' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.5 6.65 4.9 2.8v7.7' fill='%23000'/%3E%3C/svg%3E\");background:var(--bg);color:var(--color);cursor:default;display:block;height:inherit;overflow:auto;width:inherit}.index-module_inspector__q3168 ::selection{background:#b8c6ff;color:#000}.index-module_inspector__q3168,.index-module_inspector__q3168 *{box-sizing:border-box;font-family:monospace;font-size:12px}.index-module_rows__IJe-X{height:auto;position:relative;width:inherit}.index-module_row__wpjpD{align-items:center;display:flex;position:absolute;width:100%}.index-module_row__wpjpD.index-module_getter__L0ERN .index-module_row-preview__tqyCP:hover{text-decoration:underline}.index-module_row-indent__xyNRx{background-image:linear-gradient(90deg,transparent 9px,#727272 0,#727272 10px,transparent 0);background-size:16px;display:block;height:inherit}.index-module_row-content__S5er1{align-items:center;border-radius:.25rem;display:flex;padding:0 .25rem 0 .125rem;width:inherit}.index-module_row-content__S5er1:hover{background:var(--hover-bg)}.index-module_row-expand__vsdGW{height:14px;mask-size:auto;min-height:14px;min-width:14px;transition:transform .1s ease-in-out;width:14px}.index-module_row-expand__vsdGW.index-module_visible__D7mEE{background-color:currentColor;mask-image:var(--expand-icon)}.index-module_row-expand__vsdGW.index-module_visible__D7mEE.index-module_expanded__woQ-O{transform:rotate(90deg)}.index-module_row-key__k15GN{color:var(--key-color);font-weight:bolder;white-space:nowrap}.index-module_row-colon__4OAG3{white-space:pre}.index-module_row-preview__tqyCP{white-space:nowrap}.index-module_contextmenu__z28D2{background:#181818;border:1px solid #252525;border-radius:.75rem;box-shadow:0 2px 16px 4px rgba(0,0,0,.1);flex-direction:column;gap:.125rem;padding:.5rem;position:fixed;z-index:999}.index-module_contextmenu__z28D2 *{color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;font-size:.75rem}.index-module_contextmenu-item__sqyM1{border-radius:.25rem;cursor:pointer;padding:.375rem .75rem;white-space:nowrap}.index-module_contextmenu-item__sqyM1:hover{background:#242424}.index-module_widthIntrinsic__AMhiI,.index-module_widthIntrinsic__AMhiI .index-module_rows__IJe-X{width:fit-content}.index-module_heightIntrinsic__8V9BW{height:fit-content}";
var styles$1 = {"inspector":"index-module_inspector__q3168","rows":"index-module_rows__IJe-X","row":"index-module_row__wpjpD","getter":"index-module_getter__L0ERN","row-preview":"index-module_row-preview__tqyCP","row-indent":"index-module_row-indent__xyNRx","row-content":"index-module_row-content__S5er1","row-expand":"index-module_row-expand__vsdGW","visible":"index-module_visible__D7mEE","expanded":"index-module_expanded__woQ-O","row-key":"index-module_row-key__k15GN","row-colon":"index-module_row-colon__4OAG3","contextmenu":"index-module_contextmenu__z28D2","contextmenu-item":"index-module_contextmenu-item__sqyM1","widthIntrinsic":"index-module_widthIntrinsic__AMhiI","heightIntrinsic":"index-module_heightIntrinsic__8V9BW"};
styleInject(css_248z$1);

const ROW_HEIGHT = 18;
const ROW_INDENT = 16;
const PREVIEW_DEPTH = 2;
const PREVIEW_MAX_ARRAY_LENGTH = 100;
const PREVIEW_MAX_STRING_LENGTH = 1000;
const PREVIEW_MAX_SET_LENGTH = 5;
const PREVIEW_MAX_MAP_LENGTH = 5;
const PREVIEW_MAX_OBJECT_LENGTH = 5;

// Just some symbols
const symbols = {
    ellipsis: '…',
    function: 'ƒ'
};

var css_248z = ".buildPreview-module_desc__5js7a,.buildPreview-module_preview-key__yQj4J{color:#a0a0a0}.buildPreview-module_bigint__B5PXf{color:#b0b0b0}.buildPreview-module_regexp__dC0du,.buildPreview-module_string__ztNiD,.buildPreview-module_symbol__xbw19{color:#61caff}.buildPreview-module_boolean__Pk5lU,.buildPreview-module_number__3nJV3{color:#9783f7}.buildPreview-module_null__oMCN2,.buildPreview-module_undefined__MF9QK{color:#868686}.buildPreview-module_keyword__KZzAe{color:#ff8b1c}.buildPreview-module_element-tagName__oo8TD{color:#659fff}.buildPreview-module_element-className__0Zwe2{color:#a6d2ff}.buildPreview-module_element-id__3E9ph{color:#ff8f26}";
var styles = {"preview-key":"buildPreview-module_preview-key__yQj4J","desc":"buildPreview-module_desc__5js7a","bigint":"buildPreview-module_bigint__B5PXf","string":"buildPreview-module_string__ztNiD","regexp":"buildPreview-module_regexp__dC0du","symbol":"buildPreview-module_symbol__xbw19","number":"buildPreview-module_number__3nJV3","boolean":"buildPreview-module_boolean__Pk5lU","undefined":"buildPreview-module_undefined__MF9QK","null":"buildPreview-module_null__oMCN2","keyword":"buildPreview-module_keyword__KZzAe","element-tagName":"buildPreview-module_element-tagName__oo8TD","element-className":"buildPreview-module_element-className__0Zwe2","element-id":"buildPreview-module_element-id__3E9ph"};
styleInject(css_248z);

function buildPreview(value, previewOptions) {
    if (previewOptions && getType(previewOptions) !== 'Object') {
        throw new Error('options must be an object');
    }
    const options = Object.assign({
        depth: PREVIEW_DEPTH,
        detail: true,
        maxArrayLength: PREVIEW_MAX_ARRAY_LENGTH,
        maxStringLength: PREVIEW_MAX_STRING_LENGTH,
        maxSetLength: PREVIEW_MAX_SET_LENGTH,
        maxMapLength: PREVIEW_MAX_MAP_LENGTH,
        maxObjectLength: PREVIEW_MAX_OBJECT_LENGTH,
        type: 'normal',
        self: null
    }, previewOptions);
    function wrapText(text, type) {
        if (options.type === 'styleless')
            return `${text}`;
        return `<span class="${styles[type]}">${text}</span>`;
    }
    function safeWrapText(text, type) {
        return wrapText(safeString(text), type);
    }
    function wrapKey(key) {
        return safeWrapText(key, 'preview-key');
    }
    const seen = new WeakSet();
    function traverse(value, depth) {
        const type = getType(value);
        const isTop = depth == 0;
        const showDetail = options.detail == true && isTop;
        let preview = '';
        if (type === 'Object') {
            if (seen.has(value))
                // Circular
                return `{${symbols.ellipsis}}`;
            seen.add(value);
        }
        if (depth > options.depth)
            return symbols.ellipsis;
        if (type === 'Array') {
            const len = value.length;
            if (showDetail) {
                preview = value.slice(0, options.maxArrayLength).map((item) => traverse(item, depth + 1)).join(', ');
                if (len > options.maxArrayLength)
                    preview += ', ' + symbols.ellipsis;
                return wrapText(`${len > 1 ? safeWrapText(`(${len})`, 'desc') : ''} [${preview}]`, 'array');
            }
            return wrapText(`Array(${safeString(len)})`, 'array');
        }
        if (type === 'Object') {
            if (showDetail) {
                const keys = Reflect.ownKeys(value);
                preview = keys.slice(0, options.maxObjectLength).map((k) => {
                    const t = value[k];
                    return `${wrapKey(k)}: ${wrapText(traverse(t, depth + 1), getType(t).toLowerCase())}`;
                }).join(', ');
                if (keys.length > options.maxObjectLength)
                    preview += ', ' + symbols.ellipsis;
                return wrapText(`{${preview}}`, 'object');
            }
            if (depth > 0)
                return wrapText(`{${symbols.ellipsis}}`, 'object');
            return wrapText(`Object`, 'object');
        }
        if (type === 'String') {
            return isTop ? wrapText(`\"${safeString(value)}\"`, 'string') : wrapText(`\'${safeString(value)}\'`, 'string');
        }
        if (type.includes('Function')) {
            if (showDetail) {
                const fnCode = functionToCode(value);
                const cName = value.constructor?.toString().toLowerCase() || '';
                const isArrow = !value.prototype && !/^(?:async\s+)?function/.test(fnCode);
                const isAsync = cName.includes('async');
                const isGenerator = cName.includes('generator');
                const isClass = (fnCode || '').trim().startsWith('class');
                if (isClass) {
                    return wrapText(`${wrapText('class', 'keyword')} ${safeString(value.prototype?.constructor?.name)}`, 'function');
                }
                else if (isArrow) {
                    return wrapText(`${isAsync ? wrapText('async', 'keyword') : ''} () => {}`, 'function');
                }
                else {
                    preview += isAsync ? wrapText('async', 'keyword') : '';
                    preview += wrapText(`${isAsync ? ' ' : ''}${symbols.function}`, 'keyword');
                    preview += isGenerator ? wrapText('*', 'keyword') : '';
                    preview += ` ${value.name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? safeString(value.name) : ''}()`;
                    return wrapText(preview, 'function');
                }
            }
            else {
                return wrapText(symbols.function, 'function');
            }
        }
        if (isElement(value)) {
            const id = value.id;
            const classArr = [...value.classList];
            const className = (classArr.length > 0 ? '.' : '') + classArr.join('.');
            return wrapText(`${safeWrapText(value.tagName.toLowerCase(), 'element-tagName')}${safeWrapText(id ? '#' + id : '', 'element-id')}${safeWrapText(className, 'element-className')}`, 'generic');
        }
        if (type === 'Map') {
            const size = value.size;
            if (showDetail) {
                const keys = [...value.keys()];
                preview = keys.slice(0, options.maxMapLength).map(k => {
                    const t = value.get(k);
                    return `${safeWrapText(`\'${k}\'`, 'string')} => ${traverse(t, depth + 1)}`;
                }).join(', ');
                if (size > options.maxMapLength) {
                    preview += ', ' + symbols.ellipsis;
                }
                return wrapText(`${wrapText(`Map(${safeString(size)})`, 'desc')} {${preview}}`, 'map');
            }
            return wrapText(`Map(${safeString(size)})`, 'map');
        }
        if (type === 'Set') {
            const size = value.size;
            if (showDetail) {
                const keys = [...value.keys()];
                preview = keys.slice(0, options.maxSetLength).map(k => {
                    return `${traverse(k, depth + 1)}`;
                }).join(', ');
                if (size > options.maxSetLength) {
                    preview += ', ' + symbols.ellipsis;
                }
                return wrapText(`${wrapText(`Set(${safeString(size)})`, 'desc')} {${preview}}`, 'set');
            }
            return wrapText(`Set(${safeString(size)})`, 'set');
        }
        if (type == 'Error') {
            return wrapText('Error: ' + safeString(value.message), 'error');
        }
        if ([
            'Number', 'Boolean', 'Null', 'Undefined', 'Symbol', 'Date', 'Regexp'
        ].includes(type)) {
            return wrapText(safeString(value), type.toLowerCase());
        }
        if (!isExpandable(value)) {
            return wrapText(safeString(value), type.toLowerCase());
        }
        else {
            return safeWrapText(type, type.toLowerCase());
        }
    }
    try {
        return traverse(options.self || value, 0);
    }
    catch (e) {
        const type = getType(options.self || value);
        return safeWrapText(type, type.toLowerCase());
    }
}

class NodeManager {
    nextId;
    nodeMap;
    root;
    visibleNodes;
    constructor(rootValue) {
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
    getNodePath(node) {
        let path = node.parent?.path || '';
        if (node.parent?.type.includes('[[prototype]]'))
            return String(node.key);
        if (node.parent?.type.includes('dummy-object') ||
            node.type.includes('dummy-object') ||
            node.type.includes('chunk') ||
            node.level === 0)
            return path;
        if (node.parent?.valueType === 'Array') {
            path += `[${node.key}]`;
        }
        else if (node.type.includes('symbol')) {
            path += `["${String(node.key)}"]`;
        }
        else {
            path += path ? `.${node.key}` : String(node.key);
        }
        return path;
    }
    handleLargeArray(node, valueRef, originalType, options) {
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
                });
                node.children.push(child);
            }
        }
        else {
            for (let i = 0; i < len; i++) {
                const key = String(start ? start + i : i);
                const value = valueRef[i];
                const childNodeData = {
                    parent: node,
                    key: key,
                    value: value,
                    preview: buildPreview(value),
                    type: []
                };
                if (originalType === 'Map') {
                    childNodeData.preview = `{${buildPreview(value.key, {
                        type: 'styleless'
                    })} => ${buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'styleless'
                    })}}`;
                    childNodeData.type = ['dummy-object'];
                }
                if (originalType === 'Set') {
                    childNodeData.preview = buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'styleless'
                    });
                    childNodeData.type = ['dummy-object'];
                }
                const child = this.createNode(childNodeData);
                node.children.push(child);
            }
        }
    }
    createNode({ parent, key, value, valueGetter, preview, type = 'normal', originalType, self, attachment = null }) {
        const valueType = getType(value);
        try {
            if (typeof preview !== 'string') {
                preview = buildPreview(value, {
                    self: valueType.includes('Element') ? self : null
                });
            }
        }
        catch (e) {
            preview = `[Exception: ${e}]`;
        }
        const id = this.nextId++;
        const listeners = new Map();
        const node = new Proxy({
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
            on: (event, callback) => {
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
                target[key] = value;
                if (key !== 'width') {
                    // ignore width changes to avoid infinite loop when rendering
                    listeners.get('visibleSizeChange')?.forEach((callback) => callback());
                }
                return true;
            }
        });
        node.path = this.getNodePath(node);
        node.accessGetter = () => {
            if (!node.valueGetter)
                return;
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
                    });
                }
                else {
                    node.preview = buildPreview(node.valueRef);
                }
            }
            catch (e) {
                node.valueRef = `[Exception: ${e}]`;
                node.valueType = 'string';
                node.hasChildren = false;
                node.type?.push('styleless');
                node.preview = node.valueRef;
            }
        };
        node.increaseVisibleSize = (size) => {
            node.visibleSize += size;
            node.parent?.increaseVisibleSize?.(size);
        };
        node.decreaseVisibleSize = (size) => {
            node.visibleSize -= size;
            node.parent?.decreaseVisibleSize?.(size);
        };
        const createNodes = (data, keys, nodeType, self) => {
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
                        });
                    }
                    if (setter) {
                        datas.push({
                            key: 'set ' + String(k),
                            type: 'setterFunc',
                            value: setter,
                            isSymbol
                        });
                    }
                }
                else {
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
                            });
                        }
                        else {
                            datas.push({
                                key: String(k),
                                type: 'common',
                                value: data[k],
                                isSymbol
                            });
                        }
                    }
                    catch (e) {
                        datas.push({
                            key: String(k),
                            type: 'plaintext',
                            value: `[${e}]`,
                            isSymbol
                        });
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
                    });
                    node.children.push(child);
                });
            });
        };
        node.expand = (options = {
            prototype: true,
            symbols: true
        }) => {
            if (node.parent && !this.checkParentExpanded(node))
                return false;
            let expandQueue = [];
            if (!node.childrenLoaded) {
                const type = getType(node.valueRef);
                if (type === 'Array' &&
                    !node.type.includes('[[prototype]]')) {
                    this.handleLargeArray(node, node.valueRef, originalType || 'Array', options);
                }
                else if (node.attachment && node.type.includes('chunk')) {
                    this.handleLargeArray(node, node.valueRef, originalType || 'Array', options);
                }
                else if ((type === 'Map' || type === "Set") &&
                    !node.type.includes('[[prototype]]')) {
                    const arr = [...node.valueRef.keys().map((key, i) => {
                            const value = type === 'Map' ? node.valueRef.get(key) : key;
                            return type === 'Map' ? { key, value } : { value };
                        })];
                    const child = this.createNode({
                        parent: node,
                        key: '[[Entries]]',
                        value: arr,
                        preview: '',
                        type: ['[[entries]]'],
                        originalType: type
                    });
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
                }
                else {
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
                if (__proto__ &&
                    !node.type.includes('dummy-object') &&
                    !node.type.includes('[[entries]]') &&
                    !node.type.includes('chunk') &&
                    options.prototype === true) {
                    let preview;
                    if (type.includes('Element')) {
                        preview = getType(__proto__);
                    }
                    else {
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
                    });
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
        };
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
        };
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
                    delete node[key];
                });
            }
        };
        this.nodeMap.set(id, node);
        return node;
    }
    async expandNodeRecursively(node) {
        try {
            if (node.valueGetter) {
                // not expanding nodes with valueGetter to avoid potential infinite loops or side effects
                return true;
            }
            if (!node.hasChildren)
                return true;
        }
        catch (e) { }
        try {
            await new Promise(async (resolve, reject) => {
                requestAnimationFrame(() => {
                    const result = node.expand?.();
                    if (node.expand && result === false) {
                        return reject();
                    }
                    resolve();
                });
            });
        }
        catch (e) {
            return false;
        }
        for (const child of node.children) {
            if (child.key === '[[Prototype]]' || child.key === 'prototype')
                continue;
            if (!await this.expandNodeRecursively(child)) {
                // failed to expand child node, stop expanding further
                return false;
            }
        }
        return true;
    }
    checkParentExpanded(node) {
        return node.parent ? node.parent.expanded && this.checkParentExpanded(node.parent) : true;
    }
    findNodeAtIndex(index) {
        function traverse(node, index) {
            if (index === 0)
                return node;
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
    findChildrenSize(node) {
        if (!node.hasChildren || !node.childrenLoaded || !node.expanded)
            return 0;
        let size = 0;
        for (const child of node.children) {
            size += this.findChildrenSize(child) + 1;
        }
        return size;
    }
    removeNode(node) {
        node.destroy?.();
        this.visibleNodes = [];
        this._buildVisibleNodes(this.root);
    }
    removeChildren(node) {
        node.destroy?.(false);
        this.visibleNodes = [];
        this._buildVisibleNodes(this.root);
    }
    _buildVisibleNodes(node) {
        this.visibleNodes.push(node);
        if (node.expanded && node.childrenLoaded && node.children) {
            for (const child of node.children) {
                this._buildVisibleNodes(child);
            }
        }
    }
}

class ViewportProvider extends EventEmitter {
    constructor() {
        super();
    }
    getScrollTop() {
        console.warn("[ViewportProvider] getScrollTop() not implemented");
        return 0;
    }
    getScrollLeft() {
        console.warn("[ViewportProvider] getScrollLeft() not implemented");
        return 0;
    }
    getClientWidth() {
        console.warn("[ViewportProvider] getClientWidth() not implemented");
        return 0;
    }
    getClientHeight() {
        console.warn("[ViewportProvider] getClientHeight() not implemented");
        return 0;
    }
    destroy() {
    }
    notifyScroll() {
        this.emit("scroll", this.getState());
    }
    notifyResize() {
        this.emit("resize", this.getState());
    }
    getState() {
        return {
            clientWidth: this.getClientWidth(),
            clientHeight: this.getClientHeight(),
            scrollTop: this.getScrollTop(),
            scrollLeft: this.getScrollLeft(),
        };
    }
}
class DefaultViewportProvider extends ViewportProvider {
    inspectorEl;
    resizeObserver;
    onScroll = () => this.notifyScroll();
    onResize = () => this.notifyResize();
    constructor(inspectorEl) {
        super();
        this.inspectorEl = inspectorEl;
        this.inspectorEl.addEventListener('scroll', this.onScroll);
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.inspectorEl);
    }
    destroy() {
        this.resizeObserver?.disconnect();
        this.inspectorEl.removeEventListener("scroll", this.onScroll);
    }
    getScrollTop() {
        return this.inspectorEl.scrollTop;
    }
    getScrollLeft() {
        return this.inspectorEl.scrollLeft;
    }
    getClientWidth() {
        return this.inspectorEl.clientWidth;
    }
    getClientHeight() {
        return this.inspectorEl.clientHeight;
    }
}

class ObjectInspector {
    nodeManager;
    rows;
    options;
    inspectorEl = document.createElement('div');
    rowsEl = document.createElement('div');
    menuEl = document.createElement('div');
    onScroll;
    onResize;
    viewportProvider;
    defaultViewportProvider;
    static version = __VERSION__;
    static ViewportProvider = ViewportProvider;
    get width() {
        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.width > maxWidth ? node.width : maxWidth;
        });
        return maxWidth;
    }
    get height() {
        return (this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT;
    }
    on;
    off;
    constructor(container, obj, options = {
        width: "viewport",
        height: "viewport"
    }) {
        if (!container)
            throw new Error('container is required');
        if (!isElement(container))
            throw new Error('container must be an element');
        const eventEmitter = new EventEmitter();
        this.on = (event, listener) => eventEmitter.on(event, listener);
        this.off = (event, listener) => eventEmitter.off(event, listener);
        this.nodeManager = new NodeManager(clone(obj));
        this.rows = new Map();
        this.options = options;
        this.nodeManager.root.on('visibleSizeChange', () => {
            eventEmitter.emit('resize', {
                width: this.width,
                height: this.height
            });
            this.render();
            this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
        });
        this.inspectorEl.className = styles$1.inspector;
        this.rowsEl.className = styles$1.rows;
        this.menuEl.className = styles$1.contextmenu;
        container.appendChild(this.inspectorEl);
        this.inspectorEl.appendChild(this.rowsEl);
        window.addEventListener('click', () => {
            this.menuEl.remove();
        });
        if (this.options.width === 'intrinsic') {
            this.inspectorEl.style.overflowX = 'visible';
            this.inspectorEl.classList.add(styles$1.widthIntrinsic);
        }
        if (this.options.height === 'intrinsic') {
            this.inspectorEl.style.overflowY = 'visible';
            this.inspectorEl.classList.add(styles$1.heightIntrinsic);
        }
        this.onResize = (event) => {
            eventEmitter.emit('resize', {
                width: this.width,
                height: this.height
            });
            if (this.options.width === 'viewport') {
                this.rows.forEach(row => row.updateMaxWidth(this.viewportProvider.getClientWidth()));
            }
        };
        let lastTime = 0;
        let lastScroll = 0;
        let timeout = null;
        this.onScroll = (event) => {
            const scrollTop = this.viewportProvider.getScrollTop();
            if (scrollTop == lastScroll)
                return;
            const viewportSize = Math.ceil(this.viewportProvider.getClientHeight() / ROW_HEIGHT);
            const now = Date.now();
            const delta = now - lastTime;
            const distance = Math.abs(scrollTop - lastScroll);
            const speed = distance / delta * 1000;
            let tolerant = speed / ROW_HEIGHT * 2;
            let topTolerance = tolerant;
            let bottomTolerance = tolerant;
            if (tolerant > viewportSize / 2) {
                tolerant = viewportSize / 2;
            }
            if (scrollTop > lastScroll) {
                bottomTolerance = tolerant;
                topTolerance = ~~(tolerant * 0.3);
            }
            else {
                topTolerance = tolerant;
                bottomTolerance = ~~(tolerant * 0.3);
            }
            lastScroll = scrollTop;
            lastTime = now;
            this.requestRender(topTolerance, bottomTolerance);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                this.render(topTolerance, bottomTolerance);
                timeout = null;
            }, 33);
        };
        this.defaultViewportProvider = new DefaultViewportProvider(this.inspectorEl);
        this.attachViewportProvider(this.defaultViewportProvider);
        this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
        this.render();
    }
    destroy() {
        this.detachCurrentProvider();
        this.defaultViewportProvider.destroy();
        this.nodeManager.destroy();
        this.rows.clear();
        this.inspectorEl.remove();
        Object.keys(this).forEach((key) => {
            delete this[key];
        });
    }
    detachCurrentProvider = () => {
        if (!this.viewportProvider) {
            return;
        }
        this.viewportProvider.off("scroll", this.onScroll);
        this.viewportProvider.off("resize", this.onResize);
    };
    attachViewportProvider(provider) {
        if (this.viewportProvider === provider) {
            return;
        }
        this.detachCurrentProvider();
        this.viewportProvider = provider;
        provider.on('resize', this.onResize);
        provider.on('scroll', this.onScroll);
        this.syncViewport();
    }
    detachViewportProvider() {
        this.attachViewportProvider(this.defaultViewportProvider);
    }
    syncViewport = () => {
        this.onResize({
            clientWidth: this.viewportProvider.getClientWidth(),
            clientHeight: this.viewportProvider.getClientHeight(),
            scrollTop: this.viewportProvider.getScrollTop(),
            scrollLeft: this.viewportProvider.getScrollLeft()
        });
        this.onScroll({
            clientWidth: this.viewportProvider.getClientWidth(),
            clientHeight: this.viewportProvider.getClientHeight(),
            scrollTop: this.viewportProvider.getScrollTop(),
            scrollLeft: this.viewportProvider.getScrollLeft()
        });
    };
    buildContextMenu = (node, x, y) => {
        this.menuEl.innerHTML = '';
        const items = [];
        if (node.level !== 0 && // top-level object has no key!!!
            !node.type.includes('[[prototype]]') && // [[Prototype]] is a virtual object that cannot be accessed via key
            !node.type.includes('chunk') // large array chunks ( doesn't exist in real array )
        ) {
            items.push({
                text: 'Copy key',
                action: async () => {
                    try {
                        await navigator.clipboard.writeText(node.key);
                        console.log("Copied key to clipboard:", node.key);
                    }
                    catch (err) {
                        console.error("Failed to copy", err);
                    }
                }
            }, {
                text: 'Copy key path',
                action: async () => {
                    await navigator.clipboard.writeText(node.path || '');
                }
            });
        }
        items.push({
            text: 'Copy value',
            action: async () => {
                await navigator.clipboard.writeText(node.valueRef);
            }
        });
        if (!node.valueGetter && node.hasChildren) {
            items.push({
                text: 'Expand recursively',
                action: async () => {
                    await this.nodeManager.expandNodeRecursively(node);
                    this.render();
                }
            });
        }
        for (const item of items) {
            const menuItem = document.createElement('div');
            menuItem.className = styles$1['contextmenu-item'];
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            this.menuEl.appendChild(menuItem);
        }
        this.menuEl.style.left = `${x}px`;
        this.menuEl.style.top = `${y}px`;
        this.menuEl.style.display = 'flex';
        document.body.appendChild(this.menuEl);
        const height = this.menuEl.clientHeight;
        const width = this.menuEl.clientWidth;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        if (y + height > windowHeight) {
            this.menuEl.style.top = `${windowHeight - height}px`;
        }
        if (x + width > windowWidth) {
            this.menuEl.style.left = `${windowWidth - width}px`;
        }
    };
    getRowRange = (topTolerance = 0, bottomTolerance = 0) => {
        const scrollTop = this.viewportProvider.getScrollTop();
        const height = this.viewportProvider.getClientHeight();
        const count = height / ROW_HEIGHT;
        const topRow = ~~(scrollTop / ROW_HEIGHT);
        const bottomRow = topRow + count;
        if (topRow - count > this.nodeManager.root.visibleSize) {
            return {
                start: -1,
                end: -1
            };
        }
        let defaultTolerance = ~~(count / 4);
        if (defaultTolerance < 10) {
            defaultTolerance = 10;
        }
        let top = topRow - defaultTolerance;
        let bottom = bottomRow + defaultTolerance;
        top -= topTolerance;
        bottom += bottomTolerance;
        if (count > this.nodeManager.root.visibleSize) {
            return {
                start: 0,
                end: this.nodeManager.root.visibleSize - 1
            };
        }
        else {
            if (top < 0) {
                top = 0;
            }
            if (bottom > this.nodeManager.root.visibleSize - 1) {
                bottom = this.nodeManager.root.visibleSize - 1;
            }
            if (bottom < 0) {
                bottom = 0;
            }
            if (top > bottom) {
                top = bottom;
            }
            return {
                start: ~~top,
                end: ~~bottom
            };
        }
    };
    createRow = (node, index) => {
        const row = document.createElement('div');
        const indent = document.createElement('div');
        const content = document.createElement('div');
        const expand = document.createElement('div');
        const key = document.createElement('div');
        const colon = document.createElement('div');
        const preview = document.createElement('div');
        row.className = styles$1.row;
        row.style.height = `${ROW_HEIGHT}px`;
        row.style.lineHeight = `${ROW_HEIGHT}px`;
        indent.className = styles$1['row-indent'];
        content.className = styles$1['row-content'];
        expand.className = styles$1['row-expand'];
        key.className = styles$1['row-key'];
        colon.className = styles$1['row-colon'];
        preview.className = styles$1['row-preview'];
        row.style.top = `${index * ROW_HEIGHT}px`;
        row.appendChild(indent);
        row.appendChild(content);
        content.appendChild(expand);
        content.appendChild(key);
        content.appendChild(colon);
        content.appendChild(preview);
        function updateIndent(level) {
            indent.style.minWidth = `${level * ROW_INDENT}px`;
        }
        function updateKey(val) {
            key.textContent = val;
        }
        function updatePreview(val) {
            preview.innerHTML = val;
        }
        function updatePosition(val) {
            if (index === val)
                return;
            index = val;
            row.style.top = `${index * ROW_HEIGHT}px`;
        }
        let lastMaxWidth = 0;
        const updateMaxWidth = (width) => {
            // set the max-width to the viewport width when options.width is set to "viewport" mode
            if (this.options.width === 'intrinsic')
                return;
            if (width === lastMaxWidth)
                return;
            if (!width) {
                width = this.viewportProvider.getClientWidth();
            }
            row.style.maxWidth = `${width}px`;
            lastMaxWidth = width;
        };
        const measureWidth = () => {
            if (!this.nodeManager.nodeMap.get(node.id))
                return;
            this.nodeManager.nodeMap.get(node.id).width = row.scrollWidth;
        };
        function initialize() {
            updateKey(node.key);
            updatePreview(node.preview);
            updateIndent(node.level);
            updateMaxWidth();
            key.style.removeProperty('opacity');
            key.style.removeProperty('fontWeight');
            key.style.removeProperty('color');
            if (node.type.includes('property')) {
                key.style.opacity = '.6';
            }
            if (node.type.includes('[[prototype]]') ||
                node.type.includes('[[entries]]')) {
                key.style.color = '#868686';
                key.style.fontWeight = '400';
            }
            if (node.type.includes('prototype')) {
                key.style.fontWeight = '400';
                key.style.opacity = '.6';
            }
            if (node.valueGetter && node.preview === '(...)') {
                row.classList.add(styles$1.getter);
                preview.addEventListener('click', getValue);
                function getValue(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    node.accessGetter?.();
                    preview.removeEventListener('click', getValue);
                    initialize();
                }
            }
            else {
                row.classList.remove(styles$1.getter);
            }
            if (node.key && node.preview) {
                colon.textContent = ': ';
            }
            else {
                colon.textContent = '';
            }
            if (node.hasChildren) {
                expand.classList.add(styles$1.visible);
            }
            else {
                expand.classList.remove(styles$1.visible);
            }
            if (node.expanded) {
                expand.classList.add(styles$1.expanded);
            }
            else {
                expand.classList.remove(styles$1.expanded);
            }
        }
        initialize();
        row.addEventListener('click', () => {
            if (!node)
                return;
            if (!node.hasChildren)
                return;
            if (node.expanded) {
                node.collapse?.();
                expand.classList.remove(styles$1.expanded);
            }
            else {
                node.expand?.();
                expand.classList.add(styles$1.expanded);
            }
            this.render();
        });
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.buildContextMenu(node, e.clientX, e.clientY);
            return false;
        });
        return {
            row, index, updatePosition, measureWidth, updateMaxWidth
        };
    };
    render = (topTolerance = 0, bottomTolerance = 0) => {
        const rowRange = this.getRowRange(topTolerance, bottomTolerance);
        const scrollLeft = this.inspectorEl.scrollLeft;
        const nodes = this.nodeManager.visibleNodes.slice(rowRange.start, rowRange.end + 1);
        const { visibleNodes } = this.nodeManager;
        const visibleNodeIds = new Set();
        for (let i = rowRange.start; i <= rowRange.end; i++) {
            if (visibleNodes[i]) {
                visibleNodeIds.add(visibleNodes[i].id);
            }
        }
        for (const [id, row] of this.rows.entries()) {
            if (!visibleNodeIds.has(id)) {
                row.row.remove();
                this.rows.delete(id);
            }
        }
        if (this.options.width === 'intrinsic') {
            // set the width of rowsEl to 0px to measure the content width of each row
            this.rowsEl.style.width = '0px';
        }
        let last = null;
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            if (!this.rows.has(node.id)) {
                const newRow = this.createRow(node, rowRange.start + i);
                if (last) {
                    this.rowsEl.insertBefore(newRow.row, last);
                }
                else {
                    this.rowsEl.appendChild(newRow.row);
                }
                this.rows.set(node.id, newRow);
            }
            else {
                this.rows.get(node.id)?.updatePosition(rowRange.start + i);
            }
            this.rows.get(node.id)?.measureWidth();
            if (this.options.width === 'viewport') {
                this.rows.get(node.id)?.updateMaxWidth();
            }
            last = this.rows.get(node.id)?.row;
        }
        if (scrollLeft > this.inspectorEl.scrollWidth) {
            this.inspectorEl.scrollLeft = this.inspectorEl.scrollWidth;
        }
        else {
            this.inspectorEl.scrollLeft = scrollLeft;
        }
        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.width > maxWidth ? node.width : maxWidth;
        });
        this.rowsEl.style.width = `${maxWidth}px`;
    };
    requestRender = throttle((...arg) => this.render(...arg), 66);
}

export { ObjectInspector as default };
//# sourceMappingURL=index.js.map
