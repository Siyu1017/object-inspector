import { buildPreview } from "./buildPreview";
import { NodeOptions } from "./types";
import { EventEmitter, isExpandable, safeGetType } from "./utils";

export class Node extends EventEmitter {
    private _visibleSize = 1;

    get visibleSize() {
        return this._visibleSize;
    }
    setVisibleSize(size: number) {
        this._visibleSize = size;
        this.emit('visibleSizeChange')
    }

    widthDirty = false;

    id!: number;
    parent?: Node;
    level: number;
    key: any;
    value: any;
    valueType: string;
    valueGetter: (() => any) | null;
    hasChildren!: boolean;
    childrenLoaded: boolean = false;
    children: Node[] = [];
    expanded: boolean = false;

    target: any | null;
    preview: string;
    flags: string[];
    attachment: any | null;
    contentWidth: number = 0;
    path?: string;

    constructor(id: number, {
        parent,
        key,
        value,
        valueGetter,
        preview,
        flags = [],
        target,
        attachment = null
    }: NodeOptions) {
        super();

        const valueType = safeGetType(value);
        try {
            if (typeof preview !== 'string') {
                preview = buildPreview(value, {
                    self: valueType.includes('Element') ? target : null
                })
            }
        } catch (e) {
            preview = `[Exception: ${e}]`;
        }

        this.id = id;
        this.parent = parent;
        this.level = (parent ? parent.level : -1) + 1;
        this.key = key;
        this.value = value;
        this.valueGetter = valueGetter || null;
        this.valueType = valueType;
        this.hasChildren = isExpandable(value);
        this.target = target;
        this.preview = preview || '';
        this.flags = flags;
        this.attachment = attachment || null;
    }

    calculateVisibleSize() {
        let size = 1;
        if (!this.expanded) return size;

        for (const child of this.children) {
            size += child.visibleSize;
        }
        return size;
    }
}
