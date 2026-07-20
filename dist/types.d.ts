import { Node } from "./node";
export interface ViewportState {
    scrollTop: number;
    scrollLeft: number;
    clientWidth: number;
    clientHeight: number;
}
export type Row = {
    row: HTMLDivElement;
    updatePosition: (index: number) => void;
    updateMaxWidth: (width?: number) => void;
    measureWidth: () => number;
    update: (node: Node, index?: number) => void;
    destroy: () => void;
};
/**
 * viewport: container-based size
 * intrinsic: content-based size
 */
export type ObjectInspectorOptions = {
    width: "viewport" | "intrinsic";
    height: "viewport" | "intrinsic";
};
export type NodeOptions = {
    parent?: Node;
    key?: string;
    value: any;
    valueGetter?: () => any;
    preview?: string;
    flags?: string[];
    originalType?: string;
    target?: any;
    attachment?: any;
};
export type NodeExpandOptions = {
    prototype?: boolean;
    symbols?: boolean;
};
export type BuildPreviewOptions = {
    depth?: number;
    detail?: boolean;
    maxArrayLength?: number;
    maxStringLength?: number;
    maxSetLength?: number;
    maxMapLength?: number;
    maxObjectLength?: number;
    type?: string;
    self?: any;
};
export interface PropertySnapshot {
    key: string | symbol;
    value?: any;
    type: string;
    getter?: boolean;
    enumerable: boolean;
}
export interface ObjectSnapshot {
    type: string;
    properties: PropertySnapshot[];
}
//# sourceMappingURL=types.d.ts.map