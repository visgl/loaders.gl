# @loaders.gl/polyfills

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains polyfills for running on older browsers (mainly Edge and IE11) as well as Node.

Under Node.js, importing `@loaders.gl/polyfills` also installs the minimal image support used by `@loaders.gl/images`:

- a global `ImageBitmap` polyfill backed by decoded pixel data
- a global `getImageBitmapData(image)` helper that unwraps that bitmap back to `{data, width, height}`

This image support is intentionally minimal. It is designed for `ImageBitmapLoader` and parsed-image helpers, not as a full `createImageBitmap()` implementation.

For documentation please visit the [website](https://loaders.gl).
