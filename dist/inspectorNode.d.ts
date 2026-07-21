import { NodeOptions } from "./types";
import { EventEmitter } from "./utils";
export declare class InspectorNode extends EventEmitter {
    private _visibleSize;
    get visibleSize(): number;
    setVisibleSize(size: number): void;
    widthDirty: boolean;
    id: number;
    parent?: InspectorNode;
    level: number;
    key: any;
    value: any;
    valueType: string;
    valueGetter: (() => any) | null;
    hasChildren: boolean;
    childrenLoaded: boolean;
    children: InspectorNode[];
    expanded: boolean;
    target: any | null;
    preview: string;
    previewText: string;
    flags: string[];
    attachment: any | null;
    contentWidth: number;
    path?: string;
    constructor(id: number, { parent, key, value, valueGetter, preview, previewText, flags, target, attachment }: NodeOptions);
    calculateVisibleSize(): number;
}
//# sourceMappingURL=inspectorNode.d.ts.map