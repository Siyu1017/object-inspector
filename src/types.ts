import { InspectorNode } from "./inspectorNode";

export interface ViewportState {
    scrollTop: number;
    scrollLeft: number;
    clientWidth: number;
    clientHeight: number;
}

export type Row = {
    node: InspectorNode;
    row: HTMLDivElement;
    updatePosition: (index: number) => void;
    updateMaxWidth: (width?: number) => void;
    measureWidth: () => number;
    update: (node: InspectorNode, index?: number) => void;
    destroy: () => void;
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
    parent?: InspectorNode;
    key?: string;
    value: any;
    valueGetter?: () => any;
    preview?: string;
    previewText?: string;
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
    type?: 'plaintext' | 'normal',
    self?: any
}

export type InspectorSelection = {
    startNode: InspectorNode;
    endNode: InspectorNode;
    startOffset: number;
    endOffset: number;
};
