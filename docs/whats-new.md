# What's New

## v1.1

### @loaders.gl/gltf

- New: `GLTFScenegraph` class - Provides methods for structured access and modification of glTF data.
- New: `GLBLoader`/`GLBWriter` objects that support loading/saving custom GLB-formatted data.
- The `GLTFLoader` now returns a pure JavaScript object, rather than an instance of the `GLTFParser` class (by setting `options.GLTFParser: false`).

### @loaders.gl/images

- New function: `getImageMIMEType(arrayBuffer)` returns the MIME type of the image in the supplied `ArrayBuffer`.

### @loaders.gl/images

- New function: `getImageMIMEType(arrayBuffer)` returns the MIME type of the image in the supplied `ArrayBuffer`.

### @loaders.gl/images

- New function: `getImageMIMEType(arrayBuffer)` returns the MIME type of the image in the supplied `ArrayBuffer`.

### @loaders.gl/3d-tiles: New module

- Support for the 3D tiles format is being developed in the new `@loaders.gl/3d-tiles` module.
- Loading of point cloud tiles, including support for Draco compression and compact color formats such as RGB565 is supported.

### @loaders.gl/polyfills: New module

Node support now requires importing `@loaders.gl/polyfills` before use. This reduces the number of dependencies, bundle size and potential build complications when using other loaders.gl modules when not using Node.js support.

### @loaders.gl/loader-utils: New module

Helper functions for loaders have been broken out from `@loaders.gl/core`. Individual loaders no longer depend on @loaders.gl/core but only on @loaders.gl/loader-utils.

## v1.0

- First Official Release
