import { NodeOptions } from "./types";
import { EventEmitter } from "./utils";
export declare class Node extends EventEmitter {
    private _visibleSize;
    get visibleSize(): number;
    setVisibleSize(size: number): void;
    id: number;
    parent?: Node;
    level: number;
    key: any;
    value: any;
    valueType: string;
    valueGetter: (() => any) | null;
    hasChildren: boolean;
    childrenLoaded: boolean;
    children: Node[];
    expanded: boolean;
    target: any | null;
    preview: string;
    flags: string[];
    attachment: any | null;
    contentWidth: number;
    path?: string;
    constructor(id: number, { parent, key, value, valueGetter, preview, flags, target, attachment }: NodeOptions);
    calculateVisibleSize(): number;
}
//# sourceMappingURL=node.d.ts.map