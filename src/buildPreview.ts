import { symbols } from "./symbols";
import { functionToCode, getType, isElement, isExpandable, isProxy, safeString as _safeString } from "./utils";
import styles from "./buildPreview.module.css";
import { PREVIEW_DEPTH, PREVIEW_MAX_ARRAY_LENGTH, PREVIEW_MAX_MAP_LENGTH, PREVIEW_MAX_OBJECT_LENGTH, PREVIEW_MAX_SET_LENGTH, PREVIEW_MAX_STRING_LENGTH } from "./constants";
import { BuildPreviewOptions } from "./types";

export function buildPreview(value: any, previewOptions?: BuildPreviewOptions): string {
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

    function safeString(text: any): string {
        return _safeString(text, options.type !== 'plaintext');
    }

    function wrapText(text: string, type: string) {
        if (options.type === 'plaintext') return `${text}`;
        return `<span class="${styles[type]}">${text}</span>`;
    }

    function safeWrapText(text: string | symbol, type: string) {
        return wrapText(safeString(text), type);
    }

    function wrapKey(key: string | symbol) {
        return safeWrapText(key, 'preview-key');
    }

    const seen = new WeakSet();

    function traverse(value: any, depth: number) {
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

        if (depth > options.depth) return symbols.ellipsis;

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
                preview = keys.slice(0, options.maxObjectLength).map((k: string | symbol) => {
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
                } else if (isArrow) {
                    return wrapText(`${isAsync ? wrapText('async', 'keyword') : ''} () => {}`, 'function');
                } else {
                    preview += isAsync ? wrapText('async', 'keyword') : '';
                    preview += wrapText(`${isAsync ? ' ' : ''}${symbols.function}`, 'keyword');
                    preview += isGenerator ? wrapText('*', 'keyword') : '';
                    const name = Object.getOwnPropertyDescriptor(value, 'name')?.value;
                    preview += ` ${name && fnCode.match(/function([\s\S]*?)\(.*?\)/)?.[1]?.replace('*', '').trim() ? safeString(name) : ''}()`;
                    return wrapText(preview, 'function');
                }
            } else {
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
        } else {
            if (isProxy(value)) {
                return safeWrapText(`Proxy(${type})`, type.toLowerCase());
            }
            return safeWrapText(type, type.toLowerCase());
        }
    }

    try {
        return traverse(options.self || value, 0);
    } catch (e) {
        const type = getType(options.self || value);
        if (isProxy(value)) {
            return safeWrapText(`Proxy(${type})`, type.toLowerCase());
        }
        return safeWrapText(type, type.toLowerCase());
    }
}
