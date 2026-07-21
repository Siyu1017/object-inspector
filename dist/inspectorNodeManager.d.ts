import { NodeOptions, NodeExpandOptions } from "./types";
import { InspectorNode } from "./inspectorNode";
export declare class InspectorNodeManager {
    nextId: number;
    nodeMap: Map<number, InspectorNode>;
    dirtyNodes: number[];
    root: any;
    visibleNodes: InspectorNode[];
    visibleNodeIndex: Map<InspectorNode, number>;
    alive: boolean;
    maxWidth: number;
    constructor(rootValue: any);
    allocateId(): number;
    updateContentWidth(node: InspectorNode, width: number): void;
    markWidthDirty(node: InspectorNode): void;
    recalculateMaxWidth(): void;
    createNode({ parent, key, value, valueGetter, preview, previewText, flags, target, attachment }: NodeOptions): InspectorNode;
    accessNodeGetter(node: InspectorNode): void;
    expandNode(node: InspectorNode, options?: NodeExpandOptions): boolean;
    collapseNode(node: InspectorNode): void;
    destroyNode(node: InspectorNode, self?: boolean): void;
    private createNodes;
    destroy(): void;
    getNodePath(node: InspectorNode): string;
    handleLargeArray(node: InspectorNode, valueRef: any, originalType: string, options: NodeExpandOptions): void;
    updateVisibleSize(node: InspectorNode): void;
    expandNodeRecursively(node: InspectorNode): Promise<boolean>;
    checkParentExpanded(node: InspectorNode): boolean;
    findChildrenSize(node: InspectorNode): number;
    removeNode(node: InspectorNode): void;
    removeChildren(node: InspectorNode): void;
    buildVisibleNodes(node: InspectorNode): void;
    updateVisibleNodeIndex(): void;
}
//# sourceMappingURL=inspectorNodeManager.d.ts.map