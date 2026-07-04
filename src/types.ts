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

export type Node = {
    id: number,
    parent?: Node,
    level: number,
    key: any,
    valueRef: any,
    valueType: string,
    valueGetter: (() => any) | null,
    hasChildren: boolean,
    childrenLoaded: boolean,
    children: Node[],
    expanded: boolean,
    visibleSize: number,
    preview: string,
    width: number,
    type: string[],
    on: (event: string, callback: () => void) => void,
    self: any | null,
    attachment: any | null,
    accessGetter?: (() => void) | null,
    increaseVisibleSize?: (size: number) => void,
    decreaseVisibleSize?: (size: number) => void,
    expand?: (options?: NodeExpandOptions) => void | boolean,
    collapse?: () => void,
    destroy?: (self?: boolean) => void,
    childTypeLoaded?: boolean,
    path?: string
}

export type NodeData = {
    parent?: any;
    key?: string;
    value: any;
    valueGetter?: () => any;
    preview?: string;
    type?: string | string[];
    originalType?: string;
    self?: any;
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
