# What's New

## v1.4 (In Development, alpha/beta releases will soon become available)

### Loaders

- All exported (non-worker) loaders are now guaranteed to expose a `parse` function (in addition to any additional, morer specialized `parseSync/parseText/parseInBatches` functions).
- This makes it easier to import and use loader modules without importing `@loaders.gl/core`, which can reduce footprint when building small applications.
- All exported loader and writer objects now expose a `mimeType` field. This field is not yet used by `@loaders.gl/core` but is available for applications (e.g. see `selectLoader`).

## v1.3

Release Date: Sep 13, 2019

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
  - # Many improvements to the v2 glTF parser.
    The 1.3 release makes the `Tile3DLoader` ready for production, in particular for point cloud tilesets. It brings related improvements across the <strong>core</strong> and <strong>gltf</strong> modules, notably support for worker thread pools that speed up repeated parsing of the same data format.

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/uber-web/loaders.gl/master/website/static/images/example-3d-tiles.png" />
        <p><strong>Tile3DLoader</strong></p>
      </td>
    </tr>
  </tbody>
</table>

### @loaders.gl/3d-tiles

- **Tile3DLayer moved to deck.gl**

  - The `Tile3DLayer` can now be imported from `@deck.gl/geo-layers`, and no longer needs to be copied from the loaders.gl example

- **Batched 3D Model Tile Support**

  - `b3dm` tilesets can now be loaded and displayed by the `Tile3DLayer`

- **Performance Tracking**

  - `Tileset3D` now contain a `stats` object which tracks the loading process to help profile big tilesets.
  - Easily displayed in your UI via the `@probe.gl/stats-widget` module (see 3d-tiles example).

- **Request Scheduling**
  - The `Tileset3D` class now cancels loads for not-yet loaded tiles that are no longer in view).
  - Scehduling dramatically improves loading performance when panning/zooming through large tilesets.

### @loaders.gl/gltf

- **Version 2 Improvements** - Select the new glTF parser by passing `options.gltf.parserVersion: 2` to the `GLTFLoader`. - Many improvements to the v2 glTF parser.
  > > > > > > > Update whats new

### @loaders.gl/core

- **Loader Selection Improvements**

  - The loader selection mechanism is now exposed to apps through the new `selectLoader` API.
  - Loaders can now examine the first bytes of a file
  - This complements the existing URL extension based auto detection mechanisms.

- **Worker Thread Pool**
  - Now reuses worker threads. Performance gains by avoiding worker startup overhead.
  - Worker threads are named, easy to track in debugger
  - Worker based loaders can now call `parse` recursively to delegate parsing of embedded data (e.g. glTF, Draco) to other loaders

## v1.2

The 1.2 release is a smaller release that resolves various issues encountered while using 1.1.

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

The 1.1 release addresses a number of gaps in original loaders.gl release, introduces the `GLTFLoader`, and initiates work on 3DTiles support.

Release Date: May 30, 2019

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/uber-web/loaders.gl/master/website/static/images/example-gltf.jpg" />
        <p><strong>GLTFLoader</strong></p>
      </td>
    </tr>
  </tbody>
</table>

### @loaders.gl/core

- `fetchFile` function - Can now read browser `File` objects (from drag and drop or file selection dialogs).
- `isImage(arrayBuffer [, mimeType])` function - can now accept a MIME type as second argument.

### @loaders.gl/images

- `getImageMIMEType(arrayBuffer)` function ( EW) - returns the MIME type of the image in the supplied `ArrayBuffer`.
- `isImage(arrayBuffer [, mimeType])` function - can now accept a MIME type as second argument.

### @loaders.gl/gltf

- The glTF module has been refactored with the aim of simplifying the loaded data and orthogonalizing the API.
- "Embedded' GLB data (GLBs inside other binary formats) can now be parsed (e.g. the glTF parser can now extract embedded glTF inside 3D tile files).

- New classes/functions:
  - [`GLTFScenegraph`](/docs/api-reference/gltf/gltf-scenegraph) class (NEW) - A helper class that provides methods for structured access to and modification/creation of glTF data.
  - [`postProcessGLTF`](/docs/api-reference/gltf/post-process-gltf) function ( EW) - Function that performs a set of transformations on loaded glTF data that simplify application processing.
  - [`GLBLoader`](/docs/api-reference/gltf/glb-loader)/[`GLBWriter`](NEW) - loader/writer pair that enables loading/saving custom (non-glTF) data in the binary GLB format.
  - [`GLTFLoader`](/docs/api-reference/gltf/gltf-loader), letting application separately handle post-processing.

### @loaders.gl/3d-tiles (NEW MODULE)

- Support for the 3D tiles format is being developed in the new `@loaders.gl/3d-tiles` module.
- Loading of individual point cloud tiles, including support for Draco compression and compact color formats such as RGB565 is supported.

### @loaders.gl/polyfills (NEW MODULE)

Node support now requires importing `@loaders.gl/polyfills` before use. This reduces the number of dependencies, bundle size and potential build complications when using other loaders.gl modules when not using Node.js support.

### @loaders.gl/loader-utils (NEW MODULE)

Helper functions for loaders have been broken out from `@loaders.gl/core`. Individual loaders no longer depend on`@loaders.gl/core` but only on `@loaders.gl/loader-utils`.

## v1.0

Release Date: April 2019

First Official Release
