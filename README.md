# Object Inspector

[![npm version](https://img.shields.io/npm/v/@siyu1017/object-inspector)](https://www.npmjs.com/package/@siyu1017/object-inspector)
[![npm downloads](https://img.shields.io/npm/dm/@siyu1017/object-inspector)](https://www.npmjs.com/package/@siyu1017/object-inspector)
[![license](https://img.shields.io/npm/l/@siyu1017/object-inspector)](https://www.npmjs.com/package/@siyu1017/object-inspector)
[![jsDelivr](https://data.jsdelivr.com/v1/stats/packages/npm/%40siyu1017%2Fobject-inspector/badge?type=hits&period=month&style=rounded)](https://www.jsdelivr.com/package/npm/@siyu1017/object-inspector)

A Chrome DevTools-inspired JavaScript object inspector built for high-performance applications.

Object Inspector provides a familiar object inspection experience for developer tools, consoles, debuggers, and browser-based IDEs. It is optimized for inspecting extremely large and deeply nested JavaScript objects through virtual scrolling and lazy expansion, keeping rendering smooth while minimizing DOM usage.

## Highlights

- Handles hundreds of thousands of properties
- Virtualized tree rendering
- Zero dependencies

## Features

- Chrome DevTools-inspired object inspection
- Virtual scrolling
- Lazy expansion
- Recursively expand objects
- Prototype chain inspection
- Symbol property support
- Circular reference detection
- Getter and setter visualization
- Value type highlighting
- Context menu support
- High-performance tree rendering
- Support for extremely large object graphs

## Why Object Inspector?

Rendering every property of a large JavaScript object quickly becomes expensive. Traditional object viewers often create thousands of DOM elements, leading to poor performance and excessive memory usage.

Object Inspector virtualizes the object tree and lazily expands child nodes, meaning only the visible portion of the tree is rendered. This allows smooth scrolling and responsive interaction even when inspecting hundreds of thousands of properties.

## Installation

```bash
npm install @siyu1017/object-inspector
```

## CDN

Object Inspector is also available via jsDelivr.

- ESM

  ```js
  import ObjectInspector from 'https://cdn.jsdelivr.net/npm/@siyu1017/object-inspector/+esm';
  ```

- UMD

  ```html
  <script src="https://cdn.jsdelivr.net/npm/@siyu1017/object-inspector@latest/dist/index.umd.js"></script>
  ```

## Quick Start

```js
import ObjectInspector from '@siyu1017/object-inspector';

const container = document.getElementById("container");
const object = {
    name: "John",
    age: 30,
    address: {
        city: "New York",
        zip: 10001
    },
    emails: ["john@gmail.com", "john@example.com"]
};

new ObjectInspector(container, object);
```

## API

ObjectInspector supports external viewport integration, event-driven updates, and lifecycle control through a minimal instance API.

### Constructor

```js
new ObjectInspector(container, object, options?)
```

Creates a new ObjectInspector instance and mounts it into the given container.

#### container

- Type: `HTMLElement`
- Required: `true`

Root DOM element where the inspector will be rendered.

#### object

- Type: `unknown`
- Required: `true`

Target object to be inspected.

#### options

- Type: `Object`
- Optional: `true`

Configuration options that control how the inspector determines its size behavior.

#### options.width

- Type: `"viewport" | "intrinsic"`
- Default: `"viewport"`

Controls how the horizontal size of the inspector is determined.

#### options.height

- Type: `"viewport" | "intrinsic"`
- Default: `"viewport"`

Controls how the vertical size of the inspector is determined.

|Value|Behavior|
|:---:|--------|
|`"viewport"`|The size is constrained by the container's explicit dimensions and is independent of the expanded content.|
|`"intrinsic"`|The size is determined by the expanded content of the object tree.|

> [!NOTE]
> When using `"intrinsic"` mode, [`ViewportProvider`](#viewportprovider) can be used to enable efficient virtual scrolling and prevent full DOM expansion.

### inspector.attachViewportProvider(provider)

Attaches a custom viewport provider to synchronize external scroll containers.

#### provider

- Type: [`ViewportProvider`](#viewportprovider)
- Required: `true`

Provides scroll and size information for external viewport integration.

### inspector.detachViewportProvider()

Removes the current viewport provider and restores default scrolling behavior.

### inspector.destroy()

Destroys the instance and releases all internal resources and listeners.

### inspector.on(event, listener)

Registers an event listener for inspector events.

#### event

- Type: `string`
- Required: `true`

Event name to listen to (e.g. `resize`).

#### listener

- Type: `Function`
- Required: `true`

Callback invoked when the event is emitted.

### inspector.off(event, listener)

Removes a previously registered event listener.

#### event

- Type: `string`
- Required: `true`

Event name to remove.

#### listener

- Type: `Function`
- Required: `true`

The listener function to remove.

### inspector.width

- Returns: `number`

Maximum width of all expanded nodes in the tree.

### inspector.height

- Returns: `number`

The total height of all expanded nodes in the tree.

> [!NOTE]
> These values are based only on expanded nodes. Collapsed nodes are not included in the calculation.

### ObjectInspector.version

- Returns: `string`

Current version.

### ObjectInspector.ViewportProvider

- Returns: [`ViewportProvider`](#viewportprovider)

Base class for implementing custom viewport providers.

## ViewportProvider

ViewportProvider is an abstraction that supplies scroll position and viewport size to ObjectInspector.

It does not control rendering or DOM structure. It only provides external state.

### When to use

- Virtual scrolling systems
- Custom rendering environments
- External scroll containers
- When [`options.height`](#optionsheight) is set to `"intrinsic"` mode

### Required Methods

#### getScrollTop()

- Returns: `number`

Returns the vertical scroll offset of the external scroll context.

This value may come from:

- a DOM scroll container (`element.scrollTop`)
- or a virtualized scroll offset

#### getScrollLeft()

- Returns: `number`

Returns the current horizontal scroll position of the external container.

#### getClientWidth()

- Returns: `number`

Returns the visible width of the external scroll context.

#### getClientHeight()

- Returns: `number`

Returns the visible height of the external scroll context.

### Sync Methods

#### notifyScroll()

Notifies ObjectInspector that scroll position has changed. This triggers recalculation of visible node range based on updated scroll position.

```js
provider.notifyScroll();
```

#### notifyResize()

Notifies ObjectInspector that viewport size has changed.

```js
provider.notifyResize();
```

## ViewportProvider Examples

### 1. Normal DOM Scroll

Use this when the inspector is placed inside a standard scroll container.

```js
class DOMViewportProvider extends ObjectInspector.ViewportProvider {
    constructor(container) {
        super();
        this.container = container;
    }

    getScrollTop() {
        return this.container.scrollTop;
    }

    getScrollLeft() {
        return this.container.scrollLeft;
    }

    getClientWidth() {
        return this.container.clientWidth;
    }

    getClientHeight() {
        return this.container.clientHeight;
    }
}
```

#### Usage

```js
const provider = new DOMViewportProvider(container);
inspector.attachViewportProvider(provider);
```

### 2. Virtual Scrolling Integration

Use this when the inspector is embedded in a virtualized list or custom rendering system where scroll state is managed externally.

In this case, scroll position is not derived from a DOM element. Instead, it is provided by external state and must be explicitly synchronized.

```js
class VirtualViewportProvider extends ObjectInspector.ViewportProvider {
    constructor(scrollState) {
        super();
        this.state = scrollState;
    }

    getScrollTop() {
        return this.state.offsetY;
    }

    getScrollLeft() {
        return this.state.offsetX;
    }

    getClientWidth() {
        return this.state.viewportWidth;
    }

    getClientHeight() {
        return this.state.viewportHeight;
    }
}
```

#### Scroll Sync (required)

When the virtual scroll system updates, you must call [`notifyScroll()`](#notifyscroll) to synchronize the inspector.

```js
function onScroll(offsetY, offsetX) {
    scrollState.offsetY = offsetY;
    scrollState.offsetX = offsetX;

    provider.notifyScroll();
}
```

#### Usage

```js
const scrollState = {
    offsetY: 0,
    offsetX: 0,
    viewportWidth: 800,
    viewportHeight: 600
};
const provider = new VirtualViewportProvider(scrollState);
inspector.attachViewportProvider(provider);

// virtual scroll system
onScroll(newY, newX);
```

## Contributing

Contributions are welcome!

If you'd like to contribute new features, fix bugs, or improve documentation, feel free to open an issue or submit a pull request.

## License

MIT License
