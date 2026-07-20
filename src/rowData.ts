import { Node } from "./node";

export class RowData {
    node!: Node;
    index!: number;
    lastUsed: number = Date.now();
}
