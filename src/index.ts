import { clone, isElement, throttle } from "./utils";
import styles from "./index.module.css";
import { ROW_HEIGHT, ROW_INDENT } from "./constants";
import { NodeManager, Node } from "./nodeManager";

type Row = {
    row: HTMLDivElement,
    index: number,
    updatePosition: (index: number) => void,
    updateMaxWidth: (width?: number) => void,
    measureWidth: () => void
}

class ObjectInspector {
    private nodeManager: NodeManager;
    private rows: Map<number, Row>;

    private container = document.createElement('div');
    private rowsEl = document.createElement('div');
    private menuEl = document.createElement('div');

    static version: string = __VERSION__;

    get height() {
        return this.nodeManager.root.visibleSize * ROW_HEIGHT;
    }

    constructor(container: HTMLElement, obj: any) {
        if (!container)
            throw new Error('container is required');
        if (!isElement(container))
            throw new Error('container must be an element');

        /*
        if (options && getType(options) !== 'Object')
            throw new Error('options must be an object');

        this.options = Object.assign({
            shallow: false,
            prototype: true
        }, options);
        */

        this.nodeManager = new NodeManager(clone(obj));
        this.rows = new Map();

        this.nodeManager.root.on('visibleSizeChange', () => {
            this.render();
            this.rowsEl.style.height = `${this.nodeManager.root.visibleSize * ROW_HEIGHT}px`;
        });

        this.container.className = styles.container;
        this.rowsEl.className = styles.rows;
        container.appendChild(this.container);
        this.container.appendChild(this.rowsEl);

        let lastWidth = this.container.offsetWidth;
        const resizeObserver = new ResizeObserver(() => {
            const currentWidth = this.container.offsetWidth;
            if (lastWidth != currentWidth) {
                this.rows.forEach(row => row.updateMaxWidth(currentWidth));
                lastWidth = currentWidth;
            }
        })
        resizeObserver.observe(this.container);

        let lastTime = 0;
        let lastScroll = 0;

        this.container.addEventListener('scroll', throttle(() => {
            if (this.container.scrollTop == lastScroll) return;

            const viewportSize = Math.ceil(this.container.clientHeight / ROW_HEIGHT);
            const scrollTop = this.container.scrollTop;
            const now = Date.now();
            const delta = now - lastTime;
            const distance = Math.abs(scrollTop - lastScroll);
            const speed = distance / delta * 1000;

            let tolerant = speed / ROW_HEIGHT * 2;
            let topTolerance = tolerant;
            let bottomTolerance = tolerant;

            if (tolerant > viewportSize * 2) {
                tolerant = viewportSize * 2;
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

            this.render(topTolerance, bottomTolerance);
        }, 16));

        this.render();

        this.menuEl = document.createElement('div');
        this.menuEl.className = styles.contextmenu;

        window.addEventListener('click', () => {
            this.menuEl.remove();
        })
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

        const height = this.menuEl.offsetHeight;
        const width = this.menuEl.offsetWidth;
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
        const topRow = ~~(this.container.scrollTop / ROW_HEIGHT);
        const bottomRow = ~~((this.container.scrollTop + this.container.clientHeight) / ROW_HEIGHT);

        let count = this.container.clientHeight / ROW_HEIGHT;
        let top = topRow - ~~(count / 2);
        let bottom = bottomRow + ~~(count / 2);

        top -= topTolerance;
        bottom += bottomTolerance;

        if (count > this.nodeManager.root.visibleSize) {
            return {
                start: 0,
                end: this.nodeManager.root.visibleSize - 1,
                top: 0,
                bottom: this.nodeManager.root.visibleSize - 1,
                topTolerance: 0,
                bottomTolerance: 0
            };
        } else {
            if (top < 0)
                top = 0;
            if (bottom > this.nodeManager.root.visibleSize - 1)
                bottom = this.nodeManager.root.visibleSize - 1;

            return {
                start: ~~top,
                end: ~~bottom,
                top: topRow,
                bottom: bottomRow,
                topTolerance: topTolerance,
                bottomTolerance: bottomTolerance
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

        const updateMaxWidth = (width?: number) => {
            if (!width) width = this.container.offsetWidth;
            row.style.maxWidth = `${width}px`;
        }

        const measureWidth = () => {
            if (!this.nodeManager.nodeMap.get(node.id)) return;
            this.nodeManager.nodeMap.get(node.id).width = row.scrollWidth;
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
        const scrollTop = this.container.scrollTop;
        const scrollHeight = this.container.scrollHeight;
        const scrollLeft = this.container.scrollLeft;
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
            if (!this.rows.has(node.id)) {
                const newRow = this.createRow(node, rowRange.start + i);
                if (last) {
                    this.rowsEl.insertBefore(newRow.row, last);
                } else {
                    this.rowsEl.appendChild(newRow.row);
                }
                this.rows.set(node.id, newRow);
            } else {
                this.rows.get(node.id)?.updatePosition(rowRange.start + i);
            }

            this.rows.get(node.id)?.measureWidth();
            this.rows.get(node.id)?.updateMaxWidth();
            last = this.rows.get(node.id)?.row;
        }

        if (scrollLeft > this.container.scrollWidth) {
            this.container.scrollLeft = this.container.scrollWidth;
        } else {
            this.container.scrollLeft = scrollLeft;
        }

        let maxWidth = 0;
        this.nodeManager.visibleNodes.forEach(node => {
            maxWidth = node.width > maxWidth ? node.width : maxWidth;
        })
        this.rowsEl.style.width = `${maxWidth}px`;
    }
}

export default ObjectInspector;
