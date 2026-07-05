import { ViewportState } from "./types";
import { EventEmitter } from "./utils";
export declare class ViewportProvider extends EventEmitter {
    constructor();
    getScrollTop(): number;
    getScrollLeft(): number;
    getClientWidth(): number;
    getClientHeight(): number;
    destroy(): void;
    notifyScroll(): void;
    notifyResize(): void;
    protected getState(): ViewportState;
}
export declare class DefaultViewportProvider extends ViewportProvider {
    private readonly inspectorEl;
    private resizeObserver?;
    private onScroll;
    private onResize;
    constructor(inspectorEl: HTMLDivElement);
    destroy(): void;
    getScrollTop(): number;
    getScrollLeft(): number;
    getClientWidth(): number;
    getClientHeight(): number;
}
//# sourceMappingURL=viewportProvider.d.ts.map