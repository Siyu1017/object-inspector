import { clone, EventEmitter, isElement } from "./utils";
import styles from "./index.module.css";
import { ROW_HEIGHT, ROW_INDENT } from "./constants";
import type { Node } from "./node";
import { NodeManager } from "./nodeManager";
import { DefaultViewportProvider, ViewportProvider } from "./viewportProvider";
import { ObjectInspectorOptions, Row, ViewportState } from "./types";
import { RowData } from "./rowData";

class ObjectInspector {
    private readonly nodeManager: NodeManager;
    private readonly rows: Map<number, Row>;
    private readonly options: ObjectInspectorOptions;

    private readonly inspectorEl = document.createElement('div');
    private readonly measureEl = document.createElement('div');
    private readonly rowsEl = document.createElement('div');
    private readonly menuEl = document.createElement('div');

    private onScroll;
    private onResize;
    private onWindowClick;
    private scrollSpeed = 0;
    private lastScrollTop = 0;
    private lastScrollTime = 0;
    private measureRow: Row;

    private alive = true;

    private viewportProvider!: ViewportProvider;
    private defaultViewportProvider: ViewportProvider;

    static readonly version: string = __VERSION__;
    static readonly ViewportProvider: typeof ViewportProvider = ViewportProvider;

    get width() {
        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.contentWidth > maxWidth ? node.contentWidth : maxWidth;
        })
        return maxWidth;
    }

    get height() {
        return (this.nodeManager.root && this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT;
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

        const allowedValues = {
            width: ['viewport', 'intrinsic'],
            height: ['viewport', 'intrinsic']
        } as const;

        for (const key of Object.keys(allowedValues) as (keyof typeof allowedValues)[]) {
            if (!allowedValues[key].includes(this.options[key] as never)) {
                this.options[key] = allowedValues[key][0];
            }
        }

        this.nodeManager.root.on('visibleSizeChange', () => {
            eventEmitter.emit('resize', {
                width: this.width,
                height: this.height
            });
            this.render();
            this.rowsEl.style.height = `${(this.nodeManager.root.visibleSize) * ROW_HEIGHT}px`;
        });

        this.inspectorEl.className = styles.inspector;
        this.measureEl.className = styles.measure;
        this.rowsEl.className = styles.rows;
        this.menuEl.className = styles.contextmenu;
        container.appendChild(this.inspectorEl);
        this.inspectorEl.appendChild(this.measureEl);
        this.inspectorEl.appendChild(this.rowsEl);

        this.measureRow = this.createRow(true);
        this.measureEl.appendChild(this.measureRow.row);

        this.onWindowClick = () => {
            this.menuEl.remove();
        }
        window.addEventListener('click', this.onWindowClick);

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

        let renderPending = false;
        this.onScroll = (event: ViewportState) => {
            const scrollTop = event.scrollTop;
            if (scrollTop == this.lastScrollTop) return;

            const now = Date.now();
            const delta = now - this.lastScrollTime;
            const distance = Math.abs(scrollTop - this.lastScrollTop);
            const speed = distance / delta * 1000;

            this.lastScrollTop = scrollTop;
            this.lastScrollTime = now;
            this.scrollSpeed = speed;

            if (renderPending) return;
            renderPending = true;

            requestAnimationFrame(() => {
                renderPending = false;
                this.render();
            });
        }

        this.measureDirtyRows();

        this.defaultViewportProvider = new DefaultViewportProvider(this.inspectorEl);
        this.attachViewportProvider(this.defaultViewportProvider);

        this.rowsEl.style.height = `${(this.nodeManager.findChildrenSize(this.nodeManager.root) + 1) * ROW_HEIGHT}px`;
        this.render();
        setTimeout(() => this.render(), 33);
    }

    destroy() {
        this.alive = false;
        window.removeEventListener('click', this.onWindowClick);
        this.detachCurrentProvider();
        this.defaultViewportProvider.destroy();
        this.nodeManager.destroy();
        this.rows.clear();
        this.menuEl.remove();
        this.inspectorEl.remove();
    }

    private detachCurrentProvider = () => {
        if (!this.viewportProvider) {
            return;
        }

        this.viewportProvider.off("scroll", this.onScroll);
        this.viewportProvider.off("resize", this.onResize);
    }


    attachViewportProvider(provider: ViewportProvider) {
        if (this.viewportProvider === provider || !this.alive) {
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
            !node.flags.includes('[[prototype]]') &&    // [[Prototype]] is a virtual object that cannot be accessed via key
            !node.flags.includes('chunk')               // large array chunks ( doesn't exist in real array )
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
                await navigator.clipboard.writeText(node.value);
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

    private measureDirtyRows() {
        if (!this.alive) return;

        let scrollSpeed = this.scrollSpeed;
        let maxWidth = this.nodeManager.maxWidth;

        const count = Math.max(1, ~~(Math.pow(1 - scrollSpeed / 5000, 2) * 500));
        const dirtyNodes = this.nodeManager.dirtyNodes.splice(0, count);
        for (const nodeId of dirtyNodes) {
            const node = this.nodeManager.nodeMap.get(nodeId);
            if (!node) continue;
            this.measureRow.update(node);
            this.nodeManager.updateContentWidth(node, this.measureRow.measureWidth());
        }

        if (this.scrollSpeed == scrollSpeed) {
            this.scrollSpeed = 0;
        }

        requestAnimationFrame(() => {
            if (this.nodeManager.maxWidth != maxWidth) {
                this.render();
            }
            this.measureDirtyRows();
        });
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

    private createRow = (measure = false): Row => {
        const self = this;
        const rowData = new RowData();

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

        if (measure) {
            row.classList.add(styles.measure);
        }

        row.appendChild(indent);
        row.appendChild(content);
        content.appendChild(expand);
        content.appendChild(key);
        content.appendChild(colon);
        content.appendChild(preview);

        function updateNode(node: Node) {
            rowData.node = node;

            updateKey(rowData.node.key);
            updatePreview(rowData.node.preview);
            updateIndent(rowData.node.level);
        }

        let lastKey = '';
        function updateKey(val: string) {
            if (lastKey == val) return;
            lastKey = val;
            key.textContent = val;
        }

        let lastPreview = '';
        function updatePreview(val: string) {
            if (lastPreview == val) return;
            lastPreview = val;
            preview.innerHTML = val;
        }

        function updateIndent(level: number) {
            indent.style.minWidth = `${level * ROW_INDENT}px`;
        }

        function updatePosition(index: number) {
            rowData.index = index;
            row.style.top = `${rowData.index * ROW_HEIGHT}px`;
        }

        let lastMaxWidth = 0;
        function updateMaxWidth(width?: number) {
            // set the max-width to the viewport width when options.width is set to "viewport" mode
            if (self.options.width === 'intrinsic') return;
            if (width === lastMaxWidth) return;
            if (!width) {
                width = self.viewportProvider.getClientWidth();
            }
            row.style.maxWidth = `${width}px`;
            lastMaxWidth = width;
        }

        function measureWidth() {
            return row.scrollWidth;
        }

        function update(node: Node, index?: number) {
            const flags = node.flags;

            updateNode(node);
            if (!measure) {
                updatePosition(index as number);
                updateMaxWidth();
            }

            key.style.removeProperty('opacity');
            key.style.removeProperty('font-weight');
            key.style.removeProperty('color');

            key.classList.toggle(styles.property, flags.includes('property'));
            key.classList.toggle(styles.virtualKey, flags.includes('[[prototype]]') || flags.includes('[[entries]]'));
            key.classList.toggle(styles.prototype, flags.includes('prototype'));
            row.classList.toggle(styles.getter, rowData.node.valueGetter && rowData.node.preview === '(...)' ? true : false);

            const colonContent = rowData.node.key && rowData.node.preview ? ': ' : '';
            if (colon.textContent != colonContent) {
                colon.textContent = colonContent;
            }

            if (rowData.node.hasChildren) {
                expand.classList.add(styles.visible);
            } else {
                expand.classList.remove(styles.visible);
            }

            if (rowData.node.expanded) {
                expand.classList.add(styles.expanded);
            } else {
                expand.classList.remove(styles.expanded);
            }
        }

        function onClick() {
            if (!rowData.node.hasChildren) return;

            if (rowData.node.expanded) {
                self.nodeManager.collapseNode(rowData.node);
                expand.classList.remove(styles.expanded);
            } else {
                self.nodeManager.expandNode(rowData.node);
                expand.classList.add(styles.expanded);
            }

            self.render();
        }

        function onContextMenu(e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();
            self.buildContextMenu(rowData.node, e.clientX, e.clientY);
            return false;
        }

        function onPreviewClick(e: MouseEvent) {
            if (rowData.node.valueGetter && rowData.node.preview === '(...)') {
                e.preventDefault();
                e.stopPropagation();

                self.nodeManager.accessNodeGetter(rowData.node);
                update(rowData.node, rowData.index);
            }
        }

        function destroy() {
            row.removeEventListener('click', onClick);
            row.removeEventListener('contextmenu', onContextMenu);
            preview.removeEventListener('click', onPreviewClick);
            row.remove();
        }

        row.addEventListener('click', onClick);
        row.addEventListener('contextmenu', onContextMenu);
        preview.addEventListener('click', onPreviewClick);

        return {
            row, updatePosition, measureWidth, updateMaxWidth, update, destroy
        };
    }

    private render = () => {
        if (!this.alive) return;

        const scrollTop = this.viewportProvider.getScrollTop();
        const viewportSize = this.viewportProvider.getClientHeight();
        let tolerant = this.scrollSpeed / ROW_HEIGHT;
        let topTolerance = tolerant;
        let bottomTolerance = tolerant;

        if (tolerant > viewportSize) {
            tolerant = viewportSize;
        }

        if (scrollTop > this.lastScrollTop) {
            bottomTolerance = .9 * tolerant;
            topTolerance = -.4 * tolerant;
        } else {
            topTolerance = .9 * tolerant;
            bottomTolerance = -.4 * tolerant;
        }

        const rowRange = this.getRowRange(topTolerance, bottomTolerance);
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
                row = this.createRow();
                if (last) {
                    this.rowsEl.insertBefore(row.row, last);
                } else {
                    this.rowsEl.appendChild(row.row);
                }
                this.rows.set(node.id, row);
            } else {
                row = this.rows.get(node.id);
            }

            row?.update(node, rowRange.start + i);
            last = row?.row;
        }

        for (let i = nodes.length - 1; i >= 0; i--) {
            const row = this.rows.get(nodes[i].id);
            if (this.options.width === 'viewport') {
                row?.updateMaxWidth();
            }
        }

        this.rowsEl.style.width = `${this.nodeManager.maxWidth}px`;
    }
}

export default ObjectInspector;
