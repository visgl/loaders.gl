# What's New

## v1.1 (In Development)

Target Release Date: May 30, 2019

### @loaders.gl/gltf

The glTF module has been refactored with the aim of simplifying the loaded data and orthogonalizing the API, as well as allowing 'embedded' GLB data inside other binary formats to be parsed (e.g. the glTF parser can now extract embedded glTF inside 3D tile files).

- [`GLTFScenegraph`](/docs/api-reference/gltf/gltf-scenegraph) class <sup>NEW</sup> - A helper class that provides methods for structured access to and modification/creation of glTF data.
- [`postProcessGLTF`](/docs/api-reference/gltf/post-process-gltf) function <sup>NEW</sup> - Function that performs a set of transformations on loaded glTF data that simplify application processing.
- [`GLBLoader`](/docs/api-reference/gltf/glb-loader)/[`GLBWriter`] <sup>NEW</sup> - loader/writer pair that enables loading/saving custom (non-glTF) data in the binary GLB format.
- [`GLTFLoader`](/docs/api-reference/gltf/gltf-loader) <sup>ENHANCED</sup> - can now return the pure JavaScript object defined by the [GLTF category](/docs/api-reference/gltf/category-gltf), letting application separately handle post-processing etc.

### @loaders.gl/images

- `getImageMIMEType(arrayBuffer)` function <sup>NEW</sup> - returns the MIME type of the image in the supplied `ArrayBuffer`.
- `isImage(arrayBuffer [, mimeType])` function <sup>ENHANCED</sup> - can now accept a MIME type as second argument.

### @loaders.gl/3d-tiles <sup>NEW MODULE</sup>

- Support for the 3D tiles format is being developed in the new `@loaders.gl/3d-tiles` module.
- Loading of individual point cloud tiles, including support for Draco compression and compact color formats such as RGB565 is supported.

### @loaders.gl/polyfills <sup>NEW MODULE</sup>

Node support now requires importing `@loaders.gl/polyfills` before use. This reduces the number of dependencies, bundle size and potential build complications when using other loaders.gl modules when not using Node.js support.

### @loaders.gl/loader-utils <sup>NEW MODULE</sup>

Helper functions for loaders have been broken out from `@loaders.gl/core`. Individual loaders no longer depend on`@loaders.gl/core` but only on `@loaders.gl/loader-utils`.

## v1.0

Release Date: April 2019

- First Official Release
