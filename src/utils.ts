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

export function safeString(str: any): string {
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
export function clone(obj: any) {
    const seen = new WeakSet();

    function _clone(obj: any): any {
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
            if (seen.has(obj)) return obj;
            seen.add(obj);

            result = Array.isArray(obj) ? [] : {};
            if (type === 'Array') {
                for (const key in obj) {
                    // include prototype properties
                    result[key] = _clone(obj[key]);
                }
            } else {
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
