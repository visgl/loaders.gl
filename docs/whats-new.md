# What's New

## v1.3 (In Development, alpha/beta releases will soon become available)

Target Release Date: Sep 13

- `@loaders.gl/core`: **Loader Selection Improvements**
    - The loader selection mechanism is now exposed to apps through the new `selectLoader` API.
    - Loaders can now examine the first bytes of a file
    - This complements the existing URL extension based auto detection mechanisms.

- `@loaders.gl/core`: **Worker Thread Pool**
    - Now reuses worker threads. Performance gains by avoiding worker startup overhead.
    - Worker threads are named, easy to track in debugger
    - Worker based loaders can now call `parse` recursively to delegate parsing of embedded data (e.g. glTF, Draco) to other loaders

- `@loaders.gl/3d-tiles`: **Tile3DLayer moved to deck.gl**
    - Tile3DLayer is now exported from `@deck.gl/geo-layers`

- `@loaders.gl/3d-tiles`: **Batched 3D Model Tile Support**
    - `b3dm` tilesets can now be loaded and displayed by the `Tile3DLayer`

- `@loaders.gl/3d-tiles`: **RequestScheduler**
    - Cancels loads for not-yet loaded tiles that are no longer in view)
    - Dramatically improves loading performance when panning/zooming through a tileset

- `@loaders.gl/3d-tiles`: **Performance Tracking**
    - `Tileset3D` now contain a `stats` object with stats on the loading process to help profile big tilesets.

- `@loaders.gl/gltf`: **Version 2 Improvements**
    - Select the new glTF parser by passing `options.gltf.parserVersion: 2` to the `GLTFLoader`.
    - Many improvements to the v2 glTF parser.

## v1.2

Release Date: Aug 8, 2019

- `@loaders.gl/core`: File Type Auto Detection now supports binary files
- `@loaders.gl/polyfills`: Fixed `TextEncoder` warnings
- `@loaders.gl/arrow`: Improved Node 8 support
- `@loaders.gl/images`: Image file extensions now added to loader object
- `@loaders.gl/gltf`: Generate default sampler parameters if none provided in gltf file

### @loaders.gl/3d-tiles (EXPERIMENTAL)

- Support for dynamic traversal of 3D tilesets (automatically loads and unloads tiles based on viewer position and view frustum).
- Support for loading tilesets from Cesium ION servers.
- Asynchronous tileset loading
- Auto centering of view based on tileset bounding volumes
- deck.gl `Tile3DLayer` class provided in examples.

## v1.1

Release Date: May 30, 2019

### @loaders.gl/core

- `fetchFile` function - Can now read browser `File` objects (from drag and drop or file selection dialogs).
- `isImage(arrayBuffer [, mimeType])` function <sup>ENHANCED</sup> - can now accept a MIME type as second argument.

### @loaders.gl/images

- `getImageMIMEType(arrayBuffer)` function <sup>NEW</sup> - returns the MIME type of the image in the supplied `ArrayBuffer`.
- `isImage(arrayBuffer [, mimeType])` function <sup>ENHANCED</sup> - can now accept a MIME type as second argument.

### @loaders.gl/gltf

- The glTF module has been refactored with the aim of simplifying the loaded data and orthogonalizing the API.
- "Embedded' GLB data (GLBs inside other binary formats) can now be parsed (e.g. the glTF parser can now extract embedded glTF inside 3D tile files).

- New classes/functions:
    - [`GLTFScenegraph`](/docs/api-reference/gltf/gltf-scenegraph) class <sup>NEW</sup> - A helper class that provides methods for structured access to and modification/creation of glTF data.
    - [`postProcessGLTF`](/docs/api-reference/gltf/post-process-gltf) function <sup>NEW</sup> - Function that performs a set of transformations on loaded glTF data that simplify application processing.
    - [`GLBLoader`](/docs/api-reference/gltf/glb-loader)/[`GLBWriter`] <sup>NEW</sup> - loader/writer pair that enables loading/saving custom (non-glTF) data in the binary GLB format.
    - [`GLTFLoader`](/docs/api-reference/gltf/gltf-loader), letting application separately handle post-processing.

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
