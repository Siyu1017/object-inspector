import { Node } from "./node";

export interface ViewportState {
    scrollTop: number;
    scrollLeft: number;
    clientWidth: number;
    clientHeight: number;
}

export type Row = {
    row: HTMLDivElement,
    index: number,
    updatePosition: (index: number) => void,
    updateMaxWidth: (width?: number) => void,
    measureWidth: () => void
}

/**
 * viewport: container-based size
 * intrinsic: content-based size
 */
export type ObjectInspectorOptions = {
    width: "viewport" | "intrinsic",
    height: "viewport" | "intrinsic"
}

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
}

export type NodeExpandOptions = {
    prototype?: boolean,
    symbols?: boolean,
}

export type BuildPreviewOptions = {
    depth?: number,
    detail?: boolean,
    maxArrayLength?: number,
    maxStringLength?: number,
    maxSetLength?: number,
    maxMapLength?: number,
    maxObjectLength?: number,
    type?: string,
    self?: any
}
