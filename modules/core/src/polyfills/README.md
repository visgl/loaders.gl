# @loaders.gl/core/polyfills

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

The `@loaders.gl/core/polyfills` subpath installs Node.js adapters without importing the core root entry point or another loaders.gl module. Install `@loaders.gl/core` and import this subpath for its side effects.

Under Node.js, importing `@loaders.gl/core/polyfills` also installs the minimal image support used by `@loaders.gl/images`:

- a global `ImageBitmap` polyfill backed by decoded pixel data
- a global `getImageBitmapData(image)` helper that unwraps that bitmap back to `{data, width, height}`

This image support is intentionally minimal. It is designed for `ImageBitmapLoader` and parsed-image helpers, not as a full `createImageBitmap()` implementation.

Image decoding and encoding also require the optional `get-pixels`, `ndarray`, and `save-pixels` packages. Install them only when those image operations are needed.

For documentation please visit the [website](https://loaders.gl).
