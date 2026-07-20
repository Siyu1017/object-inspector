/*!
 * object-inspector v1.1.2
 * Copyright (c) Siyu1017 2026
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ObjectInspector = factory());
})(this, (function () { 'use strict';

    const __VERSION__ = '1.1.2';

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
    function isProxy(value) {
        try {
            Reflect.getPrototypeOf(value);
            return false;
        }
        catch {
            return true;
        }
    }
    function safeGetType(obj) {
        try {
            return getType(obj);
        }
        catch {
            return 'Proxy';
        }
    }
    /**
     * Based on implementation from:
     * https://github.com/angus-c/just/blob/master/packages/collection-clone/
     *
     * Original author: Angus Croll
     * License: MIT
     */
    function clone(obj) {
        const seen = new WeakMap();
        function _clone(obj) {
            const type = safeGetType(obj);
            // primitive
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            // circular reference
            if (seen.has(obj)) {
                return seen.get(obj);
            }
            if (type === 'Date') {
                return new Date(obj.getTime());
            }
            if (type === 'RegExp') {
                return new RegExp(obj.source, getRegExpFlags(obj));
            }
            if (type === 'Set') {
                const result = new Set();
                seen.set(obj, result);
                for (const value of obj) {
                    result.add(_clone(value));
                }
                return result;
            }
            if (type === 'Map') {
                const result = new Map();
                seen.set(obj, result);
                for (const [key, value] of obj) {
                    result.set(_clone(key), _clone(value));
                }
                return result;
            }
            if (type === 'Array' || type === 'Object') {
                const result = type === 'Array' ? [] : Object.create(Object.getPrototypeOf(obj));
                seen.set(obj, result);
                for (const key of Reflect.ownKeys(obj)) {
                    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                    if (!descriptor)
                        continue;
                    if ('value' in descriptor) {
                        descriptor.value = _clone(descriptor.value);
                    }
                    Object.defineProperty(result, key, descriptor);
                }
                return result;
            }
            return obj;
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
        dispose() {
            this.listeners.clear();
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

    var css_248z$1 = ".index-module_inspector__q3168{--bg:#1e1e1e;--color:#e3e3e3;--hover-bg:#33373f;--key-color:#8eacf2;--expand-icon:url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='14' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.5 6.65 4.9 2.8v7.7' fill='%23000'/%3E%3C/svg%3E\");background:var(--bg);color:var(--color);cursor:default;display:block;height:inherit;overflow:auto;width:inherit}.index-module_inspector__q3168 ::selection{background:#b8c6ff;color:#000}.index-module_inspector__q3168,.index-module_inspector__q3168 *{box-sizing:border-box;font-family:monospace;font-size:12px}.index-module_measure__RvR3C{height:0;min-width:0;pointer-events:none;position:static;visibility:hidden;width:fit-content;z-index:-1}.index-module_rows__IJe-X{height:auto;position:relative;width:inherit}.index-module_row__wpjpD{align-items:center;display:flex;position:absolute;width:100%}.index-module_row__wpjpD.index-module_getter__L0ERN .index-module_row-preview__tqyCP:hover{text-decoration:underline}.index-module_row-indent__xyNRx{background-image:linear-gradient(90deg,transparent 9px,#727272 0,#727272 10px,transparent 0);background-size:16px;display:block;height:inherit}.index-module_row-content__S5er1{align-items:center;border-radius:.25rem;display:flex;padding:0 .25rem 0 .125rem;width:inherit}.index-module_row-content__S5er1:hover{background:var(--hover-bg)}.index-module_row-expand__vsdGW{height:14px;mask-size:auto;min-height:14px;min-width:14px;transition:transform .1s ease-in-out;width:14px}.index-module_row-expand__vsdGW.index-module_visible__D7mEE{background-color:currentColor;mask-image:var(--expand-icon)}.index-module_row-expand__vsdGW.index-module_visible__D7mEE.index-module_expanded__woQ-O{transform:rotate(90deg)}.index-module_row-key__k15GN{color:var(--key-color);font-weight:bolder;white-space:nowrap}.index-module_row-key__k15GN.index-module_property__XiKbh{opacity:.6}.index-module_row-key__k15GN.index-module_virtualKey__rULrX{color:#868686;font-weight:400}.index-module_row-key__k15GN.index-module_prototype__Wv2I0{font-weight:400;opacity:.6}.index-module_row-colon__4OAG3{white-space:pre}.index-module_row-preview__tqyCP{white-space:nowrap}.index-module_contextmenu__z28D2{background:#181818;border:1px solid #252525;border-radius:.75rem;box-shadow:0 2px 16px 4px rgba(0,0,0,.1);flex-direction:column;gap:.125rem;padding:.5rem;position:fixed;z-index:999}.index-module_contextmenu__z28D2 *{color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;font-size:.75rem}.index-module_contextmenu-item__sqyM1{border-radius:.25rem;cursor:pointer;padding:.375rem .75rem;white-space:nowrap}.index-module_contextmenu-item__sqyM1:hover{background:#242424}.index-module_widthIntrinsic__AMhiI,.index-module_widthIntrinsic__AMhiI .index-module_rows__IJe-X{width:fit-content}.index-module_widthIntrinsic__AMhiI .index-module_row__wpjpD{min-width:fit-content}.index-module_heightIntrinsic__8V9BW{height:fit-content}.index-module_row__wpjpD.index-module_measure__RvR3C{min-width:0;position:static;width:fit-content}";
    var styles$1 = {"inspector":"index-module_inspector__q3168","measure":"index-module_measure__RvR3C","rows":"index-module_rows__IJe-X","row":"index-module_row__wpjpD","getter":"index-module_getter__L0ERN","row-preview":"index-module_row-preview__tqyCP","row-indent":"index-module_row-indent__xyNRx","row-content":"index-module_row-content__S5er1","row-expand":"index-module_row-expand__vsdGW","visible":"index-module_visible__D7mEE","expanded":"index-module_expanded__woQ-O","row-key":"index-module_row-key__k15GN","property":"index-module_property__XiKbh","virtualKey":"index-module_virtualKey__rULrX","prototype":"index-module_prototype__Wv2I0","row-colon":"index-module_row-colon__4OAG3","contextmenu":"index-module_contextmenu__z28D2","contextmenu-item":"index-module_contextmenu-item__sqyM1","widthIntrinsic":"index-module_widthIntrinsic__AMhiI","heightIntrinsic":"index-module_heightIntrinsic__8V9BW"};
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
                    const items = [];
                    for (let i = 0; i < len && i < options.maxArrayLength; i++) {
                        const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
                        if (!descriptor || descriptor.get) {
                            items.push('(...)');
                            continue;
                        }
                        items.push(traverse(descriptor.value, depth + 1));
                    }
                    preview = items.join(', ');
                    if (len > options.maxArrayLength)
                        preview += ', ' + symbols.ellipsis;
                    return wrapText(`${len > 1 ? safeWrapText(`(${len})`, 'desc') : ''} [${preview}]`, 'array');
                }
                return wrapText(`Array(${safeString(len)})`, 'array');
            }
            if (type === 'Object') {
                if (showDetail) {
                    const allKeys = Reflect.ownKeys(value);
                    const keys = allKeys.filter(key => {
                        const descriptor = Object.getOwnPropertyDescriptor(value, key);
                        return descriptor && !descriptor.get;
                    });
                    preview = keys.slice(0, options.maxObjectLength).map((k) => {
                        const t = Object.getOwnPropertyDescriptor(value, k)?.value;
                        return `${wrapKey(k)}: ${wrapText(traverse(t, depth + 1), getType(t).toLowerCase())}`;
                    }).join(', ');
                    if (keys.length !== allKeys.length && keys.length == 0) {
                        preview += symbols.ellipsis;
                    }
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
                    const cName = Function.prototype.toString.call(Object.getPrototypeOf(value)?.constructor).toLowerCase() || '';
                    const prototype = Object.getOwnPropertyDescriptor(value, 'prototype')?.value;
                    const className = Object.getOwnPropertyDescriptor(prototype ?? {}, 'constructor')?.value?.name;
                    const isArrow = !prototype && !/^(?:async\s+)?function/.test(fnCode) && fnCode.includes('=>');
                    const isAsync = cName.includes('async');
                    const isGenerator = cName.includes('generator');
                    const isClass = (fnCode || '').trim().startsWith('class');
                    if (isClass) {
                        return wrapText(`${wrapText('class', 'keyword')} ${safeString(className)}`, 'function');
                    }
                    else if (isArrow) {
                        return wrapText(`${isAsync ? wrapText('async', 'keyword') : ''} () => {}`, 'function');
                    }
                    else {
                        preview += isAsync ? wrapText('async', 'keyword') : '';
                        preview += wrapText(`${isAsync ? ' ' : ''}${symbols.function}`, 'keyword');
                        preview += isGenerator ? wrapText('*', 'keyword') : '';
                        const name = Object.getOwnPropertyDescriptor(value, 'name')?.value;
                        preview += ` ${name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? safeString(name) : ''}()`;
                        return wrapText(preview, 'function');
                    }
                }
                else {
                    return wrapText(symbols.function, 'function');
                }
            }
            if (isElement(value)) {
                const id = Element.prototype.getAttribute.call(value, "id");
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
                return wrapText('Error: ' + safeString(Object.getOwnPropertyDescriptor(value, "message")?.value ?? ""), 'error');
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
                if (isProxy(value)) {
                    return safeWrapText(`Proxy(${type})`, type.toLowerCase());
                }
                return safeWrapText(type, type.toLowerCase());
            }
        }
        try {
            return traverse(options.self || value, 0);
        }
        catch (e) {
            const type = getType(options.self || value);
            if (isProxy(value)) {
                return safeWrapText(`Proxy(${type})`, type.toLowerCase());
            }
            return safeWrapText(type, type.toLowerCase());
        }
    }

    class Node extends EventEmitter {
        _visibleSize = 1;
        get visibleSize() {
            return this._visibleSize;
        }
        setVisibleSize(size) {
            this._visibleSize = size;
            this.emit('visibleSizeChange');
        }
        widthDirty = false;
        id;
        parent;
        level;
        key;
        value;
        valueType;
        valueGetter;
        hasChildren;
        childrenLoaded = false;
        children = [];
        expanded = false;
        target;
        preview;
        flags;
        attachment;
        contentWidth = 0;
        path;
        constructor(id, { parent, key, value, valueGetter, preview, flags = [], target, attachment = null }) {
            super();
            const valueType = safeGetType(value);
            try {
                if (typeof preview !== 'string') {
                    preview = buildPreview(value, {
                        self: valueType.includes('Element') ? target : null
                    });
                }
            }
            catch (e) {
                preview = `[Exception: ${e}]`;
            }
            this.id = id;
            this.parent = parent;
            this.level = (parent ? parent.level : -1) + 1;
            this.key = key;
            this.value = value;
            this.valueGetter = valueGetter || null;
            this.valueType = valueType;
            this.hasChildren = isExpandable(value);
            this.target = target;
            this.preview = preview || '';
            this.flags = flags;
            this.attachment = attachment || null;
        }
        calculateVisibleSize() {
            let size = 1;
            if (!this.expanded)
                return size;
            for (const child of this.children) {
                size += child.visibleSize;
            }
            return size;
        }
    }

    class NodeManager {
        nextId;
        nodeMap;
        dirtyNodes;
        root;
        visibleNodes;
        alive = true;
        maxWidth = 0;
        constructor(rootValue) {
            this.nextId = 0;
            this.nodeMap = new Map();
            this.dirtyNodes = [];
            this.root = this.createNode({
                value: rootValue
            });
            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);
        }
        allocateId() {
            return this.nextId++;
        }
        updateContentWidth(node, width) {
            node.contentWidth = width;
            node.widthDirty = false;
            if (width >= this.maxWidth) {
                this.maxWidth = width;
            }
        }
        markWidthDirty(node) {
            if (node.widthDirty)
                return;
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
        createNode({ parent, key, value, valueGetter, preview, flags = [], target, attachment = null }) {
            const node = new Node(this.allocateId(), { parent, key, value, valueGetter, preview, flags, target, attachment });
            node.contentWidth = 0;
            node.path = this.getNodePath(node);
            this.nodeMap.set(node.id, node);
            this.markWidthDirty(node);
            return node;
        }
        accessNodeGetter(node) {
            if (!node.valueGetter)
                return;
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
                    });
                }
                else {
                    node.preview = buildPreview(node.value);
                }
            }
            catch (e) {
                node.value = `[Exception: ${e}]`;
                node.valueType = 'string';
                node.hasChildren = false;
                node.flags.push('styleless');
                node.preview = node.value;
            }
            this.markWidthDirty(node);
        }
        expandNode(node, options = {
            prototype: true,
            symbols: true
        }) {
            if (!this.alive)
                return false;
            if (node.parent && !this.checkParentExpanded(node))
                return false;
            let expandQueue = [];
            if (!node.childrenLoaded) {
                const type = getType(node.value);
                const originalType = node.attachment?.originalType;
                if (type === 'Array' &&
                    !node.flags.includes('[[prototype]]')) {
                    this.handleLargeArray(node, node.value, originalType || 'Array', options);
                }
                else if (node.attachment && node.flags.includes('chunk')) {
                    this.handleLargeArray(node, node.value, originalType || 'Array', options);
                }
                else if ((type === 'Map' || type === "Set") &&
                    !node.flags.includes('[[prototype]]')) {
                    const arr = [...node.value.keys().map((key, i) => {
                            const value = type === 'Map' ? node.value.get(key) : key;
                            return type === 'Map' ? { key, value } : { value };
                        })];
                    const child = this.createNode({
                        parent: node,
                        key: '[[Entries]]',
                        value: arr,
                        preview: '',
                        flags: ['[[entries]]'],
                        attachment: {
                            originalType: type
                        }
                    });
                    node.children.push(child);
                    expandQueue.push(child);
                }
                else {
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
                if (__proto__ &&
                    !node.flags.includes('dummy-object') &&
                    !node.flags.includes('[[entries]]') &&
                    !node.flags.includes('chunk') &&
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
                        flags: ['[[prototype]]'],
                        target: (type.includes('Element')) ? node.target : node.value,
                        preview: preview
                    });
                    node.children.push(child);
                }
                node.childrenLoaded = true;
            }
            node.expanded = true;
            this.updateVisibleSize(node);
            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);
            for (const item of expandQueue) {
                this.expandNode(item);
            }
            this.recalculateMaxWidth();
            return true;
        }
        collapseNode(node) {
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
                    child.expanded = false;
                }
            }
            node.expanded = false;
            this.updateVisibleSize(node);
            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);
            this.recalculateMaxWidth();
        }
        destroyNode(node, self = true) {
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
        createNodes(node, keys, type) {
            if (!this.alive)
                return;
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
                        });
                    }
                    if (setter) {
                        datas.push({
                            key: 'set ' + String(key),
                            type: 'setterFunc',
                            value: setter,
                            isSymbol
                        });
                    }
                }
                else {
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
                            });
                        }
                        else {
                            datas.push({
                                key: String(key),
                                type: 'common',
                                value: node.value[key],
                                isSymbol
                            });
                        }
                    }
                    catch (e) {
                        datas.push({
                            key: String(key),
                            type: 'plaintext',
                            value: `[${e}]`,
                            isSymbol
                        });
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
                        childFlags.push('styleless');
                        childFlags.push('getter');
                    }
                    if (data.type === 'plaintext')
                        childFlags.push('styleless');
                    if (data.isSymbol) {
                        childFlags.push('symbol');
                    }
                    const child = this.createNode({
                        parent: node,
                        key: data.key,
                        value: data.value,
                        flags: childFlags,
                        preview: childFlags.includes('styleless') ? data.value : null,
                        target: data.value,
                        valueGetter: data.getter
                    });
                    node.children.push(child);
                });
            });
        }
        destroy() {
            this.alive = false;
            this.destroyNode(this.root);
            this.root = null;
            this.visibleNodes.length = 0;
            this.nodeMap.clear();
        }
        getNodePath(node) {
            let path = node.parent?.path || '';
            if (node.parent?.flags.includes('[[prototype]]'))
                return String(node.key);
            if (node.parent?.flags.includes('dummy-object') ||
                node.flags.includes('dummy-object') ||
                node.flags.includes('chunk') ||
                node.level === 0)
                return path;
            if (node.parent?.valueType === 'Array') {
                path += `[${node.key}]`;
            }
            else if (node.flags.includes('symbol')) {
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
                        flags: ['chunk'],
                        attachment: {
                            parentLevels: levels,
                            startIndex: range[0],
                            originalType: originalType
                        }
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
                        flags: []
                    };
                    if (originalType === 'Map') {
                        childNodeData.preview = `{${buildPreview(value.key, {
                        type: 'styleless'
                    })} => ${buildPreview(value.value, {
                        detail: false,
                        depth: 1,
                        type: 'styleless'
                    })}}`;
                        childNodeData.flags = ['dummy-object'];
                    }
                    if (originalType === 'Set') {
                        childNodeData.preview = buildPreview(value.value, {
                            detail: false,
                            depth: 1,
                            type: 'styleless'
                        });
                        childNodeData.flags = ['dummy-object'];
                    }
                    const child = this.createNode(childNodeData);
                    node.children.push(child);
                }
            }
        }
        updateVisibleSize(node) {
            let current = node;
            while (current != undefined) {
                const size = current.calculateVisibleSize();
                current.setVisibleSize(size);
                current = current.parent;
            }
        }
        async expandNodeRecursively(node) {
            if (!this.alive)
                return false;
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
                        const result = this.expandNode(node);
                        if (result === false) {
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
            this.destroyNode(node);
            this.visibleNodes = [];
            this._buildVisibleNodes(this.root);
        }
        removeChildren(node) {
            this.destroyNode(node, false);
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
        onResize = (entries) => {
            this.viewportWidth = entries[0].contentRect.width;
            this.viewportHeight = entries[0].contentRect.height;
            this.notifyResize();
        };
        viewportWidth;
        viewportHeight;
        constructor(inspectorEl) {
            super();
            this.inspectorEl = inspectorEl;
            this.inspectorEl.addEventListener('scroll', this.onScroll);
            this.resizeObserver = new ResizeObserver(this.onResize);
            this.resizeObserver.observe(this.inspectorEl);
            this.viewportWidth = this.inspectorEl.clientWidth;
            this.viewportHeight = this.inspectorEl.clientHeight;
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
            return this.viewportWidth;
        }
        getClientHeight() {
            return this.viewportHeight;
        }
    }

    class RowData {
        node;
        index;
        lastUsed = Date.now();
    }

    class ObjectInspector {
        nodeManager;
        rows;
        options;
        inspectorEl = document.createElement('div');
        measureEl = document.createElement('div');
        rowsEl = document.createElement('div');
        menuEl = document.createElement('div');
        onScroll;
        onResize;
        onWindowClick;
        scrollSpeed = 0;
        lastScrollTop = 0;
        lastScrollTime = 0;
        measureRow;
        alive = true;
        viewportProvider;
        defaultViewportProvider;
        static version = __VERSION__;
        static ViewportProvider = ViewportProvider;
        get width() {
            let maxWidth = 0;
            this.nodeManager.visibleNodes.forEach(node => {
                maxWidth = node.contentWidth > maxWidth ? node.contentWidth : maxWidth;
            });
            return maxWidth;
        }
        get height() {
            return (this.nodeManager.root && this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT;
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
            const allowedValues = {
                width: ['viewport', 'intrinsic'],
                height: ['viewport', 'intrinsic']
            };
            for (const key of Object.keys(allowedValues)) {
                if (!allowedValues[key].includes(this.options[key])) {
                    this.options[key] = allowedValues[key][0];
                }
            }
            this.nodeManager.root.on('visibleSizeChange', () => {
                eventEmitter.emit('resize', {
                    width: this.width,
                    height: this.height
                });
                this.render();
                this.rowsEl.style.height = `${(this.nodeManager.root.visibleSize) * ROW_HEIGHT}px`;
            });
            this.inspectorEl.className = styles$1.inspector;
            this.measureEl.className = styles$1.measure;
            this.rowsEl.className = styles$1.rows;
            this.menuEl.className = styles$1.contextmenu;
            container.appendChild(this.inspectorEl);
            this.inspectorEl.appendChild(this.measureEl);
            this.inspectorEl.appendChild(this.rowsEl);
            this.measureRow = this.createRow(true);
            this.measureEl.appendChild(this.measureRow.row);
            this.onWindowClick = () => {
                this.menuEl.remove();
            };
            window.addEventListener('click', this.onWindowClick);
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
                    this.rows.forEach(row => row.updateMaxWidth(event.clientWidth));
                }
            };
            let renderPending = false;
            this.onScroll = (event) => {
                const scrollTop = event.scrollTop;
                if (scrollTop == this.lastScrollTop)
                    return;
                const now = Date.now();
                const delta = now - this.lastScrollTime;
                const distance = Math.abs(scrollTop - this.lastScrollTop);
                const speed = distance / delta * 1000;
                this.lastScrollTop = scrollTop;
                this.lastScrollTime = now;
                this.scrollSpeed = speed;
                if (renderPending)
                    return;
                renderPending = true;
                requestAnimationFrame(() => {
                    renderPending = false;
                    this.render();
                });
            };
            this.measureDirtyRows();
            this.defaultViewportProvider = new DefaultViewportProvider(this.inspectorEl);
            this.attachViewportProvider(this.defaultViewportProvider);
            this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
            this.render();
            setTimeout(() => this.render(), 33);
        }
        destroy() {
            this.alive = false;
            window.removeEventListener('click', this.onWindowClick);
            this.detachCurrentProvider();
            this.defaultViewportProvider.destroy();
            this.nodeManager.destroy();
            this.rows.clear();
            this.menuEl.remove();
            this.inspectorEl.remove();
        }
        detachCurrentProvider = () => {
            if (!this.viewportProvider) {
                return;
            }
            this.viewportProvider.off("scroll", this.onScroll);
            this.viewportProvider.off("resize", this.onResize);
        };
        attachViewportProvider(provider) {
            if (this.viewportProvider === provider || !this.alive) {
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
                !node.flags.includes('[[prototype]]') && // [[Prototype]] is a virtual object that cannot be accessed via key
                !node.flags.includes('chunk') // large array chunks ( doesn't exist in real array )
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
                    await navigator.clipboard.writeText(node.value);
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
        measureDirtyRows() {
            if (!this.alive)
                return;
            let scrollSpeed = this.scrollSpeed;
            let maxWidth = this.nodeManager.maxWidth;
            const count = Math.max(1, ~~(Math.pow(1 - scrollSpeed / 5000, 2) * 500));
            const dirtyNodes = this.nodeManager.dirtyNodes.splice(0, count);
            for (const nodeId of dirtyNodes) {
                const node = this.nodeManager.nodeMap.get(nodeId);
                if (!node)
                    continue;
                this.measureRow.update(node);
                this.nodeManager.updateContentWidth(node, this.measureRow.measureWidth());
            }
            if (this.scrollSpeed == scrollSpeed) {
                this.scrollSpeed = 0;
            }
            requestAnimationFrame(() => {
                if (this.nodeManager.maxWidth != maxWidth) {
                    this.render();
                }
                this.measureDirtyRows();
            });
        }
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
        createRow = (measure = false) => {
            const self = this;
            const rowData = new RowData();
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
            if (measure) {
                row.classList.add(styles$1.measure);
            }
            row.appendChild(indent);
            row.appendChild(content);
            content.appendChild(expand);
            content.appendChild(key);
            content.appendChild(colon);
            content.appendChild(preview);
            function updateNode(node) {
                rowData.node = node;
                updateKey(rowData.node.key);
                updatePreview(rowData.node.preview);
                updateIndent(rowData.node.level);
            }
            let lastKey = '';
            function updateKey(val) {
                if (lastKey == val)
                    return;
                lastKey = val;
                key.textContent = val;
            }
            let lastPreview = '';
            function updatePreview(val) {
                if (lastPreview == val)
                    return;
                lastPreview = val;
                preview.innerHTML = val;
            }
            function updateIndent(level) {
                indent.style.minWidth = `${level * ROW_INDENT}px`;
            }
            function updatePosition(index) {
                rowData.index = index;
                row.style.top = `${rowData.index * ROW_HEIGHT}px`;
            }
            let lastMaxWidth = 0;
            function updateMaxWidth(width) {
                // set the max-width to the viewport width when options.width is set to "viewport" mode
                if (self.options.width === 'intrinsic')
                    return;
                if (width === lastMaxWidth)
                    return;
                if (!width) {
                    width = self.viewportProvider.getClientWidth();
                }
                row.style.maxWidth = `${width}px`;
                lastMaxWidth = width;
            }
            function measureWidth() {
                return row.scrollWidth;
            }
            function update(node, index) {
                const flags = node.flags;
                updateNode(node);
                if (!measure) {
                    updatePosition(index);
                    updateMaxWidth();
                }
                key.style.removeProperty('opacity');
                key.style.removeProperty('font-weight');
                key.style.removeProperty('color');
                key.classList.toggle(styles$1.property, flags.includes('property'));
                key.classList.toggle(styles$1.virtualKey, flags.includes('[[prototype]]') || flags.includes('[[entries]]'));
                key.classList.toggle(styles$1.prototype, flags.includes('prototype'));
                row.classList.toggle(styles$1.getter, rowData.node.valueGetter && rowData.node.preview === '(...)' ? true : false);
                const colonContent = rowData.node.key && rowData.node.preview ? ': ' : '';
                if (colon.textContent != colonContent) {
                    colon.textContent = colonContent;
                }
                if (rowData.node.hasChildren) {
                    expand.classList.add(styles$1.visible);
                }
                else {
                    expand.classList.remove(styles$1.visible);
                }
                if (rowData.node.expanded) {
                    expand.classList.add(styles$1.expanded);
                }
                else {
                    expand.classList.remove(styles$1.expanded);
                }
            }
            function onClick() {
                if (!rowData.node.hasChildren)
                    return;
                if (rowData.node.expanded) {
                    self.nodeManager.collapseNode(rowData.node);
                    expand.classList.remove(styles$1.expanded);
                }
                else {
                    self.nodeManager.expandNode(rowData.node);
                    expand.classList.add(styles$1.expanded);
                }
                self.render();
            }
            function onContextMenu(e) {
                e.preventDefault();
                e.stopPropagation();
                self.buildContextMenu(rowData.node, e.clientX, e.clientY);
                return false;
            }
            function onPreviewClick(e) {
                if (rowData.node.valueGetter && rowData.node.preview === '(...)') {
                    e.preventDefault();
                    e.stopPropagation();
                    self.nodeManager.accessNodeGetter(rowData.node);
                    update(rowData.node, rowData.index);
                }
            }
            function destroy() {
                row.removeEventListener('click', onClick);
                row.removeEventListener('contextmenu', onContextMenu);
                preview.removeEventListener('click', onPreviewClick);
                row.remove();
            }
            row.addEventListener('click', onClick);
            row.addEventListener('contextmenu', onContextMenu);
            preview.addEventListener('click', onPreviewClick);
            return {
                row, updatePosition, measureWidth, updateMaxWidth, update, destroy
            };
        };
        render = () => {
            if (!this.alive)
                return;
            const scrollTop = this.viewportProvider.getScrollTop();
            const viewportSize = this.viewportProvider.getClientHeight();
            let tolerant = this.scrollSpeed / ROW_HEIGHT;
            let topTolerance = tolerant;
            let bottomTolerance = tolerant;
            if (tolerant > viewportSize) {
                tolerant = viewportSize;
            }
            if (scrollTop > this.lastScrollTop) {
                bottomTolerance = .9 * tolerant;
                topTolerance = -0.4 * tolerant;
            }
            else {
                topTolerance = .9 * tolerant;
                bottomTolerance = -0.4 * tolerant;
            }
            const rowRange = this.getRowRange(topTolerance, bottomTolerance);
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
            let last = null;
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                let row;
                if (!this.rows.has(node.id)) {
                    row = this.createRow();
                    if (last) {
                        this.rowsEl.insertBefore(row.row, last);
                    }
                    else {
                        this.rowsEl.appendChild(row.row);
                    }
                    this.rows.set(node.id, row);
                }
                else {
                    row = this.rows.get(node.id);
                }
                row?.update(node, rowRange.start + i);
                last = row?.row;
            }
            for (let i = nodes.length - 1; i >= 0; i--) {
                const row = this.rows.get(nodes[i].id);
                if (this.options.width === 'viewport') {
                    row?.updateMaxWidth();
                }
            }
            this.rowsEl.style.width = `${this.nodeManager.maxWidth}px`;
        };
    }

    return ObjectInspector;

}));
//# sourceMappingURL=index.umd.js.map
