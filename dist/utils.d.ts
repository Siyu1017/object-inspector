export declare function getType(obj: any): string;
export declare function isExpandable(value: any): boolean;
export declare function isElement(obj: any): boolean;
export declare function safeEscape(html: string): string;
export declare function functionToCode(fn: Function): string;
export declare function capitalizeFirstLetter(val: string): string;
export declare function safeString(str: any): string;
/**
 * Based on implementation from:
 * https://github.com/angus-c/just/blob/master/packages/collection-clone/
 *
 * Original author: Angus Croll
 * License: MIT
 */
export declare function clone(obj: any): any;
export declare function getRegExpFlags(regExp: RegExp): string;
export declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (this: ThisParameterType<T>, ...args: Parameters<T>) => any;
export declare function extractKeys(self: any, keys: any[]): {
    common: any[];
    accessors: any[];
};
export declare class EventEmitter {
    private listeners;
    constructor();
    on(eventName: string, handler: Function): void;
    off(eventName: string, handler: Function): void;
    once(eventName: string, handler: Function): void;
    emit(eventName: string, ...args: any[]): void;
}
//# sourceMappingURL=utils.d.ts.map