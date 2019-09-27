# Upgrade Guide

## Upgrading from v1.3 to v2.0

### `@loaders.gl/core`:

- Loaders no longer have a `loadAndParse` removed. Just define `parse` on your loaders.

### `@loaders.gl/images`:

- `ImageHTMLLoader` and `ImageHTMLLoader` removed. Use `options.images.format: 'html'` or `options.images.format: 'imagebitmap'` to control the output type.
- `loadImage(url, options)` removed. Use `load(url, ImageLoader, options)` instead.

## Upgrading from v1.2 to v1.3

- As with v1.1, `GLTFLoader` will no longer return a `GLTFParser` object in v2.0. A new option `options.gltf.parserVersion: 2` is provided to opt in to the new behavior now.

## Upgrading from v1.0 to v1.1

A couple of functions have been deprecated and will be removed in v2.0. They now emit console warnings. Start replacing your use of these functions now to remove the console warnings and ensure a smooth future upgrade to v2.0.

Also, Node support now requires installing `@loaders.gl/polyfills` before use.

### @loaders.gl/core

- Removal: Node support for `fetchFile` now requires importing `@loaders.gl/polyfills` before use.
- Removal: Node support for `TextEncoder`, and `TextDecoder` now requires importing `@loaders.gl/polyfills` before use.
- Deprecation: `TextEncoder` and `TextDecoder` will not be exported from `loaders.gl/core` in v2.0.

### @loaders.gl/images

- Removal: Node support for images now requires importing `@loaders.gl/polyfills` before use.

### @loaders.gl/gltf

- Deprecation: `GLBParser`/`GLBBuilder` - These will be merged into GLTF classes..
- Deprecation: `GLTFParser`/`GLTFBuilder` - The new `GLTF` class can hold GLTF data and lets application access/modify it.
- Deprecation: `GLTFLoader` will no longer return a `GLTFParser` object in v2.0. Instead it will return a pure javascript object containing the parse json and any binary chunks. This object can be accessed through the `GLTF` class. Set `options.GLTFParser` to `false` to opt in to the new behavior now.

## v1.0

First official release of loaders.gl.
