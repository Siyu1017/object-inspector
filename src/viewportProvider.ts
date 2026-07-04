import { ViewportState } from "./types";
import { EventEmitter } from "./utils";

export class ViewportProvider extends EventEmitter {
    constructor() {
        super();
    }
    getScrollTop(): number {
        console.warn("[ViewportProvider] getScrollTop() not implemented");
        return 0;
    }
    getScrollLeft(): number {
        console.warn("[ViewportProvider] getScrollLeft() not implemented");
        return 0;
    }
    getClientWidth(): number {
        console.warn("[ViewportProvider] getClientWidth() not implemented");
        return 0;
    }
    getClientHeight(): number {
        console.warn("[ViewportProvider] getClientHeight() not implemented");
        return 0;
    }
    destroy() {

    }
    notifyScroll() {
        this.emit("scroll", this.getState())
    }
    notifyResize() {
        this.emit("resize", this.getState())
    }
    protected getState(): ViewportState {
        return {
            clientWidth: this.getClientWidth(),
            clientHeight: this.getClientHeight(),
            scrollTop: this.getScrollTop(),
            scrollLeft: this.getScrollLeft(),
        };
    }
}

export class DefaultViewportProvider extends ViewportProvider {
    private readonly inspectorEl: HTMLDivElement;
    private resizeObserver?: ResizeObserver;
    private onScroll = () => this.notifyScroll();
    private onResize = () => this.notifyResize();

    constructor(inspectorEl: HTMLDivElement) {
        super();

        this.inspectorEl = inspectorEl;
        this.inspectorEl.addEventListener('scroll', this.onScroll);
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.inspectorEl);
    }

    destroy() {
        this.resizeObserver?.disconnect();
        this.inspectorEl.removeEventListener("scroll", this.onScroll);
    }

    getScrollTop(): number {
        return this.inspectorEl.scrollTop;
    }
    getScrollLeft(): number {
        return this.inspectorEl.scrollLeft
    }
    getClientWidth(): number {
        return this.inspectorEl.clientWidth;
    }
    getClientHeight(): number {
        return this.inspectorEl.clientHeight;
    }
}
