# Changelog

## [Unreleased]

### Fixed

- Corrected width measurement when `options.width` is set to `intrinsic`
- Invalid constructor option values now automatically fall back to their default values

### Improved

- Improved internal architecture to enhance maintainability and reliability
- Improved rendering performance

## [1.1.2] - 2026-07-05

### Fixed

- Fixed missing TypeScript declaration files in previous releases

## [1.1.1] - 2026-07-04

### Fixed

- Fixed missing event listener registration for `DefaultViewportProvider`

## [1.1.0] - 2026-07-04

### Added

- Unified sizing system with `viewport` and `intrinsic` modes for both width and height
- External viewport integration via `ObjectInspector.ViewportProvider`
- Lifecycle API with `destroy()` for cleanup and `on()/off()` for event handling
- Viewport synchronization APIs `notifyScroll()` and `notifyResize()` for external state updates
- Dynamic viewport switching via `attachViewportProvider()` and `detachViewportProvider()`
- Expanded node-based metrics with `inspector.width` (maximum expanded node width) and `inspector.height` (total expanded node height)

### Improved

- Improved visible area calculation logic to more accurately and efficiently determine the rendering window

### Fixed

- Fixed an issue where `[[Prototype]]` was repeatedly rendered in each chunk when displaying large `Array`, `Map`, and `Set` structures by ensuring prototype rendering occurs only once per object instance

## [1.0.0] - 2026-07-02

### Added

- Context menu support
- Automatically expand viewport to fit the widest existing row
- Recursive node expansion
- Support for large `Map` and `Set` collections
- Expandable tree view for object inspection
- Support for deeply nested object graphs
- Circular reference detection and safe rendering
- `[[Prototype]]` chain inspection
- Getter and setter detection without invocation
- Support for `Symbol` properties
- Value type highlighting (`String`, `Number`, `Array`, `Object`, etc.)
- ESM and UMD builds
