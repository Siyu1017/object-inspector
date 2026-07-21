export function getType(obj: any): string {
    return {}.toString.call(obj).slice(8, -1);
}

export function isExpandable(value: any): boolean {
    if (value === null) return false;

    const t = typeof value;

    if (t !== "object" && t !== "function")
        return false;

    return true;
}

export function isElement(obj: any): boolean {
    try {
        return obj instanceof Element;
    }
    catch (e) {
        return (typeof obj === "object") &&
            (obj.nodeType === 1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

export function safeEscape(html: string): string {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function functionToCode(fn: Function): string {
    try {
        return Function.prototype.toString.call(fn);
    } catch (e) { }
    try {
        return fn + '';
    } catch (e) { }
    return '';
}

export function capitalizeFirstLetter(val: string): string {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function safeString(str: any, escape = true): string {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return escape ? safeEscape(str) : str;
}

export function isProxy(value: any) {
    try {
        Reflect.getPrototypeOf(value);
        return false;
    } catch {
        return true;
    }
}

export function safeGetType(obj: any) {
    try {
        return getType(obj);
    } catch {
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
export function clone(obj: any) {
    const seen = new WeakMap<object, any>();

    function _clone(obj: any): any {
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
                const descriptor = Object.getOwnPropertyDescriptor(obj, key)!;
                if (!descriptor) continue;
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

export function getRegExpFlags(regExp: RegExp): string {
    const flags = [];
    regExp.global && flags.push('g');
    regExp.ignoreCase && flags.push('i');
    regExp.multiline && flags.push('m');
    regExp.sticky && flags.push('y');
    regExp.unicode && flags.push('u');
    return flags.join('');
}

export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
) {
    let previousTime = 0;

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        const nowTime = Date.now();

        if (nowTime - previousTime >= delay) {
            previousTime = nowTime;
            return fn.apply(this, args);
        }
    };
}

export function extractKeys(self: any, keys: any[]) {
    const result: any[] = [];
    const accessors: any[] = [];
    keys.forEach(k => {
        const desc = Object.getOwnPropertyDescriptor(self, k);
        const hasGetter = desc && desc.get;
        const hasSetter = desc && desc.set;
        result.push(k);
        if (hasGetter || hasSetter) accessors.push(k);
    })

    return {
        common: result,
        accessors: accessors
    }
}

export class EventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    constructor() { }

    on(eventName: string, handler: Function) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        (this.listeners.get(eventName) as Function[]).push(handler);
    }

    off(eventName: string, handler: Function) {
        if (!this.listeners.has(eventName)) return;
        const index = (this.listeners.get(eventName) as Function[]).indexOf(handler);
        if (index === -1) return;
        (this.listeners.get(eventName) as Function[]).splice(index, 1);
    }

    once(eventName: string, handler: Function) {
        const onceHandler = (...args: any[]) => {
            this.off(eventName, onceHandler);
            handler(...args);
        };
        this.on(eventName, onceHandler);
    }

    emit(eventName: string, ...args: any[]) {
        const handlers = this.listeners.get(eventName);
        if (handlers) {
            for (const fn of handlers.slice()) {
                try {
                    fn(...args);
                } catch (e) {
                    console.error(`Error in handler for ${eventName}:`, e);
                }
            }
        }
    }

    dispose() {
        this.listeners.clear();
    }
}

export function getTextOffset(container: Node, offset: number, root: HTMLElement) {
    const range = document.createRange();

    range.setStart(root, 0);
    range.setEnd(container, offset);

    return range.toString().length;
}

export function findTextPosition(root: HTMLElement, offset: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let current = 0;
    while (walker.nextNode()) {
        const textNode = walker.currentNode as Text;
        const length = textNode.length;

        if (offset <= current + length) {
            return {
                node: textNode,
                offset: offset - current
            };
        }
        current += length;
    }

    return {
        node: root,
        offset: root.childNodes.length
    };
}
