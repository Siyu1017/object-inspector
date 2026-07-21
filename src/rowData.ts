import { InspectorNode } from "./inspectorNode";

export class RowData {
    node!: InspectorNode;
    index!: number;
    lastUsed: number = Date.now();
}
