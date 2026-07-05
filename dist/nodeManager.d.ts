import { Node, NodeData, NodeExpandOptions } from "./types";
export declare class NodeManager {
    nextId: number;
    nodeMap: Map<number, any>;
    root: any;
    visibleNodes: Node[];
    constructor(rootValue: any);
    destroy(): void;
    getNodePath(node: Node): string;
    handleLargeArray(node: Node, valueRef: any, originalType: string, options: NodeExpandOptions): void;
    createNode({ parent, key, value, valueGetter, preview, type, originalType, self, attachment }: NodeData): Node;
    expandNodeRecursively(node: Node): Promise<boolean>;
    checkParentExpanded(node: Node): boolean;
    findNodeAtIndex(index: number): any;
    findChildrenSize(node: Node): number;
    removeNode(node: Node): void;
    removeChildren(node: Node): void;
    _buildVisibleNodes(node: Node): void;
}
//# sourceMappingURL=nodeManager.d.ts.map