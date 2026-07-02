# Object Inspector

![npm version](https://img.shields.io/npm/v/@siyu1017/object-inspector)
![npm downloads](https://img.shields.io/npm/dm/@siyu1017/object-inspector)
![license](https://img.shields.io/npm/l/@siyu1017/object-inspector)
![npm bundle size](https://img.shields.io/bundlephobia/min/@siyu1017/object-inspector)

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

### ESM

```js
import ObjectInspector from '@siyu1017/object-inspector';
```

### UMD

```html
<script src="https://cdn.jsdelivr.net/npm/@siyu1017/object-inspector@latest/dist/index.umd.js"></script>

<script>
    const inspector = new ObjectInspector(container, object);
</script>
```

## Usage

```javascript
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

## Contributing

Contributions are welcome!

If you'd like to contribute new features, fix bugs, or improve documentation, feel free to open an issue or submit a pull request.

## License

MIT License
