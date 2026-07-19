import { NodeOptions, NodeExpandOptions } from "./types";
import { Node } from "./node";
export declare class NodeManager {
    nextId: number;
    nodeMap: Map<number, Node>;
    root: any;
    visibleNodes: Node[];
    alive: boolean;
    constructor(rootValue: any);
    allocateId(): number;
    createNode({ parent, key, value, valueGetter, preview, flags, target, attachment }: NodeOptions): Node;
    accessNodeGetter(node: Node): void;
    expandNode(node: Node, options?: NodeExpandOptions): boolean;
    collapseNode(node: Node): void;
    destroyNode(node: Node, self?: boolean): void;
    private createNodes;
    destroy(): void;
    getNodePath(node: Node): string;
    handleLargeArray(node: Node, valueRef: any, originalType: string, options: NodeExpandOptions): void;
    updateVisibleSize(node: Node): void;
    expandNodeRecursively(node: Node): Promise<boolean>;
    checkParentExpanded(node: Node): boolean;
    findChildrenSize(node: Node): number;
    removeNode(node: Node): void;
    removeChildren(node: Node): void;
    _buildVisibleNodes(node: Node): void;
}
//# sourceMappingURL=nodeManager.d.ts.map