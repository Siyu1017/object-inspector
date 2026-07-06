import { clone, EventEmitter, isElement, throttle } from "./utils";
import styles from "./index.module.css";
import { ROW_HEIGHT, ROW_INDENT } from "./constants";
import { NodeManager } from "./nodeManager";
import { DefaultViewportProvider, ViewportProvider } from "./viewportProvider";
import { Node, ObjectInspectorOptions, Row, ViewportState } from "./types";

class ObjectInspector {
    private readonly nodeManager: NodeManager;
    private readonly rows: Map<number, Row>;
    private readonly options: ObjectInspectorOptions;

    private readonly inspectorEl = document.createElement('div');
    private readonly rowsEl = document.createElement('div');
    private readonly menuEl = document.createElement('div');

    private onScroll;
    private onResize;

    private viewportProvider!: ViewportProvider;
    private defaultViewportProvider: ViewportProvider;

    static readonly version: string = __VERSION__;
    static readonly ViewportProvider: typeof ViewportProvider = ViewportProvider;

    get width() {
        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.width > maxWidth ? node.width : maxWidth;
        })
        return maxWidth;
    }

    get height() {
        return (this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT;
    }

    on: (event: string, listener: () => void) => void;
    off: (event: string, listener: () => void) => void;

    constructor(container: HTMLElement, obj: any, options: ObjectInspectorOptions = {
        width: "viewport",
        height: "viewport"
    }) {
        if (!container)
            throw new Error('container is required');
        if (!isElement(container))
            throw new Error('container must be an element');

        const eventEmitter = new EventEmitter();

        this.on = (event: string, listener: () => void) => eventEmitter.on(event, listener);
        this.off = (event: string, listener: () => void) => eventEmitter.off(event, listener);

        this.nodeManager = new NodeManager(clone(obj));
        this.rows = new Map();
        this.options = options;

        this.nodeManager.root.on('visibleSizeChange', () => {
            eventEmitter.emit('resize', {
                width: this.width,
                height: this.height
            });
            this.render();
            this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
        });

        this.inspectorEl.className = styles.inspector;
        this.rowsEl.className = styles.rows;
        this.menuEl.className = styles.contextmenu;
        container.appendChild(this.inspectorEl);
        this.inspectorEl.appendChild(this.rowsEl);
        window.addEventListener('click', () => {
            this.menuEl.remove();
        })

        if (this.options.width === 'intrinsic') {
            this.inspectorEl.style.overflowX = 'visible';
            this.inspectorEl.classList.add(styles.widthIntrinsic)
        }
        if (this.options.height === 'intrinsic') {
            this.inspectorEl.style.overflowY = 'visible';
            this.inspectorEl.classList.add(styles.heightIntrinsic)
        }

        this.onResize = (event: ViewportState) => {
            eventEmitter.emit('resize', {
                width: this.width,
                height: this.height
            });
            if (this.options.width === 'viewport') {
                this.rows.forEach(row => row.updateMaxWidth(event.clientWidth));
            }
        }

        let lastTime = 0;
        let lastScroll = 0;
        let timeout: number | null = null;
        this.onScroll = (event: ViewportState) => {
            const scrollTop = event.scrollTop;
            if (scrollTop == lastScroll) return;

            const viewportSize = Math.ceil(event.clientHeight / ROW_HEIGHT);
            const now = Date.now();
            const delta = now - lastTime;
            const distance = Math.abs(scrollTop - lastScroll);
            const speed = distance / delta * 1000;

            let tolerant = speed / ROW_HEIGHT * 2;
            let topTolerance = tolerant;
            let bottomTolerance = tolerant;

            if (tolerant > viewportSize / 2) {
                tolerant = viewportSize / 2;
            }

            if (scrollTop > lastScroll) {
                bottomTolerance = tolerant;
                topTolerance = ~~(tolerant * 0.3);
            } else {
                topTolerance = tolerant;
                bottomTolerance = ~~(tolerant * 0.3);
            }

            lastScroll = scrollTop;
            lastTime = now;

            this.requestRender(topTolerance, bottomTolerance);

            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                this.render(topTolerance, bottomTolerance);
                timeout = null;
            }, 33)
        }

        this.defaultViewportProvider = new DefaultViewportProvider(this.inspectorEl);
        this.attachViewportProvider(this.defaultViewportProvider);

        this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
        this.render();
        setTimeout(() => this.render(), 33);
    }

    destroy() {
        this.detachCurrentProvider();
        this.defaultViewportProvider.destroy();
        this.nodeManager.destroy();
        this.rows.clear();
        this.inspectorEl.remove();

        Object.keys(this).forEach((key: string) => {
            delete (this as any)[key];
        })
    }

    private detachCurrentProvider = () => {
        if (!this.viewportProvider) {
            return;
        }

        this.viewportProvider.off("scroll", this.onScroll);
        this.viewportProvider.off("resize", this.onResize);
    }


    attachViewportProvider(provider: ViewportProvider) {
        if (this.viewportProvider === provider) {
            return;
        }
        this.detachCurrentProvider();

        this.viewportProvider = provider;
        provider.on('resize', this.onResize);
        provider.on('scroll', this.onScroll);
        this.syncViewport();
    }

    detachViewportProvider() {
        this.attachViewportProvider(this.defaultViewportProvider);
    }

    private syncViewport = () => {
        this.onResize({
            clientWidth: this.viewportProvider.getClientWidth(),
            clientHeight: this.viewportProvider.getClientHeight(),
            scrollTop: this.viewportProvider.getScrollTop(),
            scrollLeft: this.viewportProvider.getScrollLeft()
        });
        this.onScroll({
            clientWidth: this.viewportProvider.getClientWidth(),
            clientHeight: this.viewportProvider.getClientHeight(),
            scrollTop: this.viewportProvider.getScrollTop(),
            scrollLeft: this.viewportProvider.getScrollLeft()
        });
    }

    private buildContextMenu = (node: Node, x: number, y: number) => {
        this.menuEl.innerHTML = '';

        const items = []

        if (
            node.level !== 0 &&                         // top-level object has no key!!!
            !node.type.includes('[[prototype]]') &&     // [[Prototype]] is a virtual object that cannot be accessed via key
            !node.type.includes('chunk')                // large array chunks ( doesn't exist in real array )
        ) {
            items.push({
                text: 'Copy key',
                action: async () => {
                    try {
                        await navigator.clipboard.writeText(node.key);
                        console.log("Copied key to clipboard:", node.key);
                    } catch (err) {
                        console.error("Failed to copy", err);
                    }
                }
            }, {
                text: 'Copy key path',
                action: async () => {
                    await navigator.clipboard.writeText(node.path || '');
                }
            });
        }

        items.push({
            text: 'Copy value',
            action: async () => {
                await navigator.clipboard.writeText(node.valueRef);
            }
        });

        if (!node.valueGetter && node.hasChildren) {
            items.push({
                text: 'Expand recursively',
                action: async () => {
                    await this.nodeManager.expandNodeRecursively(node);
                    this.render();
                }
            })
        }

        for (const item of items) {
            const menuItem = document.createElement('div');
            menuItem.className = styles['contextmenu-item'];
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            this.menuEl.appendChild(menuItem);
        }

        this.menuEl.style.left = `${x}px`;
        this.menuEl.style.top = `${y}px`;
        this.menuEl.style.display = 'flex';
        document.body.appendChild(this.menuEl);

        const height = this.menuEl.clientHeight;
        const width = this.menuEl.clientWidth;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        if (y + height > windowHeight) {
            this.menuEl.style.top = `${windowHeight - height}px`;
        }
        if (x + width > windowWidth) {
            this.menuEl.style.left = `${windowWidth - width}px`;
        }
    }

    private getRowRange = (topTolerance = 0, bottomTolerance = 0) => {
        const scrollTop = this.viewportProvider.getScrollTop();
        const height = this.viewportProvider.getClientHeight();
        const count = height / ROW_HEIGHT;
        const topRow = ~~(scrollTop / ROW_HEIGHT);
        const bottomRow = topRow + count;

        if (topRow - count > this.nodeManager.root.visibleSize) {
            return {
                start: -1,
                end: -1
            }
        }

        let defaultTolerance = ~~(count / 4);
        if (defaultTolerance < 10) {
            defaultTolerance = 10;
        }
        let top = topRow - defaultTolerance;
        let bottom = bottomRow + defaultTolerance;

        top -= topTolerance;
        bottom += bottomTolerance;

        if (count > this.nodeManager.root.visibleSize) {
            return {
                start: 0,
                end: this.nodeManager.root.visibleSize - 1
            };
        } else {
            if (top < 0) {
                top = 0;
            }
            if (bottom > this.nodeManager.root.visibleSize - 1) {
                bottom = this.nodeManager.root.visibleSize - 1;
            }
            if (bottom < 0) {
                bottom = 0;
            }
            if (top > bottom) {
                top = bottom;
            }

            return {
                start: ~~top,
                end: ~~bottom
            };
        }
    }

    private createRow = (node: Node, index: number): Row => {
        const row = document.createElement('div');
        const indent = document.createElement('div');
        const content = document.createElement('div');
        const expand = document.createElement('div');
        const key = document.createElement('div');
        const colon = document.createElement('div');
        const preview = document.createElement('div');

        row.className = styles.row;
        row.style.height = `${ROW_HEIGHT}px`;
        row.style.lineHeight = `${ROW_HEIGHT}px`;

        indent.className = styles['row-indent'];
        content.className = styles['row-content'];
        expand.className = styles['row-expand'];
        key.className = styles['row-key'];
        colon.className = styles['row-colon'];
        preview.className = styles['row-preview'];
        row.style.top = `${index * ROW_HEIGHT}px`;

        row.appendChild(indent);
        row.appendChild(content);
        content.appendChild(expand);
        content.appendChild(key);
        content.appendChild(colon);
        content.appendChild(preview);

        function updateIndent(level: number) {
            indent.style.minWidth = `${level * ROW_INDENT}px`;
        }

        function updateKey(val: string) {
            key.textContent = val;
        }

        function updatePreview(val: string) {
            preview.innerHTML = val;
        }

        function updatePosition(val: number) {
            if (index === val) return;
            index = val;
            row.style.top = `${index * ROW_HEIGHT}px`;
        }

        let lastMaxWidth = 0;
        const updateMaxWidth = (width?: number) => {
            // set the max-width to the viewport width when options.width is set to "viewport" mode
            if (this.options.width === 'intrinsic') return;
            if (width === lastMaxWidth) return;
            if (!width) {
                width = this.viewportProvider.getClientWidth();
            }
            row.style.maxWidth = `${width}px`;
            lastMaxWidth = width;
        }

        const measureWidth = () => {
            if (!this.nodeManager.nodeMap.get(node.id)) return;

            row.style.minWidth = '0px';
            row.style.width = 'fit-content';
            this.nodeManager.nodeMap.get(node.id).width = row.scrollWidth;
            row.style.removeProperty('min-width');
            row.style.removeProperty('width');
        }

        function initialize() {
            updateKey(node.key);
            updatePreview(node.preview);
            updateIndent(node.level);
            updateMaxWidth();

            key.style.removeProperty('opacity');
            key.style.removeProperty('fontWeight');
            key.style.removeProperty('color');

            if (node.type.includes('property')) {
                key.style.opacity = '.6';
            }
            if (
                node.type.includes('[[prototype]]') ||
                node.type.includes('[[entries]]')
            ) {
                key.style.color = '#868686';
                key.style.fontWeight = '400';
            }
            if (node.type.includes('prototype')) {
                key.style.fontWeight = '400';
                key.style.opacity = '.6';
            }

            if (node.valueGetter && node.preview === '(...)') {
                row.classList.add(styles.getter);
                preview.addEventListener('click', getValue);

                function getValue(e: MouseEvent) {
                    e.preventDefault();
                    e.stopPropagation();

                    node.accessGetter?.();
                    preview.removeEventListener('click', getValue);
                    initialize();
                }
            } else {
                row.classList.remove(styles.getter);
            }

            if (node.key && node.preview) {
                colon.textContent = ': ';
            } else {
                colon.textContent = '';
            }

            if (node.hasChildren) {
                expand.classList.add(styles.visible);
            } else {
                expand.classList.remove(styles.visible);
            }

            if (node.expanded) {
                expand.classList.add(styles.expanded);
            } else {
                expand.classList.remove(styles.expanded);
            }
        }

        initialize();

        row.addEventListener('click', () => {
            if (!node) return;

            if (!node.hasChildren) return;

            if (node.expanded) {
                node.collapse?.();
                expand.classList.remove(styles.expanded);
            } else {
                node.expand?.();
                expand.classList.add(styles.expanded);
            }

            this.render();
        });

        row.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.buildContextMenu(node, e.clientX, e.clientY);
            return false;
        })

        return {
            row, index, updatePosition, measureWidth, updateMaxWidth
        };
    }

    private render = (topTolerance = 0, bottomTolerance = 0) => {
        const rowRange = this.getRowRange(topTolerance, bottomTolerance);
        const scrollLeft = this.inspectorEl.scrollLeft;
        const nodes = this.nodeManager.visibleNodes.slice(rowRange.start, rowRange.end + 1);

        const { visibleNodes } = this.nodeManager;
        const visibleNodeIds = new Set();
        for (let i = rowRange.start; i <= rowRange.end; i++) {
            if (visibleNodes[i]) {
                visibleNodeIds.add(visibleNodes[i].id);
            }
        }

        for (const [id, row] of this.rows.entries()) {
            if (!visibleNodeIds.has(id)) {
                row.row.remove();
                this.rows.delete(id);
            }
        }

        let last = null;
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            let row;
            if (!this.rows.has(node.id)) {
                row = this.createRow(node, rowRange.start + i);
                if (last) {
                    this.rowsEl.insertBefore(row.row, last);
                } else {
                    this.rowsEl.appendChild(row.row);
                }
                this.rows.set(node.id, row);
            } else {
                row = this.rows.get(node.id);
                row?.updatePosition(rowRange.start + i);
            }

            row?.measureWidth();
            if (this.options.width === 'viewport') {
                row?.updateMaxWidth();
            }
            last = row?.row;
        }

        if (scrollLeft > this.inspectorEl.scrollWidth) {
            this.inspectorEl.scrollLeft = this.inspectorEl.scrollWidth;
        } else {
            this.inspectorEl.scrollLeft = scrollLeft;
        }

        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.width > maxWidth ? node.width : maxWidth;
        })
        this.rowsEl.style.width = `${maxWidth}px`;
    }

    private requestRender = throttle((...arg) => this.render(...arg), 66);
}

export default ObjectInspector;
