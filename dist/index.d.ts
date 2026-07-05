import { ViewportProvider } from "./viewportProvider";
import { ObjectInspectorOptions } from "./types";
declare class ObjectInspector {
    private readonly nodeManager;
    private readonly rows;
    private readonly options;
    private readonly inspectorEl;
    private readonly rowsEl;
    private readonly menuEl;
    private onScroll;
    private onResize;
    private viewportProvider;
    private defaultViewportProvider;
    static readonly version: string;
    static readonly ViewportProvider: typeof ViewportProvider;
    get width(): number;
    get height(): number;
    on: (event: string, listener: () => void) => void;
    off: (event: string, listener: () => void) => void;
    constructor(container: HTMLElement, obj: any, options?: ObjectInspectorOptions);
    destroy(): void;
    private detachCurrentProvider;
    attachViewportProvider(provider: ViewportProvider): void;
    detachViewportProvider(): void;
    private syncViewport;
    private buildContextMenu;
    private getRowRange;
    private createRow;
    private render;
    private requestRender;
}
export default ObjectInspector;
//# sourceMappingURL=index.d.ts.map