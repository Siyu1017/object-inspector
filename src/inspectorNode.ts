import { buildPreview } from "./buildPreview";
import { NodeOptions } from "./types";
import { EventEmitter, isExpandable, safeEscape, safeGetType } from "./utils";

export class InspectorNode extends EventEmitter {
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
    parent?: InspectorNode;
    level: number;
    key: any;
    value: any;
    valueType: string;
    valueGetter: (() => any) | null;
    hasChildren!: boolean;
    childrenLoaded: boolean = false;
    children: InspectorNode[] = [];
    expanded: boolean = false;

    target: any | null;
    preview: string;
    previewText: string;
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
        previewText,
        flags = [],
        target,
        attachment = null
    }: NodeOptions) {
        super();

        if (previewText && typeof previewText === 'string' && !preview) {
            // no preview HTML is provided
            preview = safeEscape(previewText);
        }

        const valueType = safeGetType(value);
        try {
            if (typeof preview !== 'string') {
                preview = buildPreview(value, {
                    self: valueType.includes('Element') ? target : null
                })
            }
            if (typeof previewText !== 'string') {
                previewText = buildPreview(value, {
                    self: valueType.includes('Element') ? target : null,
                    type: 'plaintext'
                })
            }
        } catch (e) {
            preview = `[Exception: ${e}]`;
            previewText = preview;
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
        this.previewText = previewText || '';
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
