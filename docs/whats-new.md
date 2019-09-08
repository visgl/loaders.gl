# What's New

## v2.0 (no release available, experimental parts accessible in v1.4-alpha)

- `@loaders.gl/images`: Redefined as a new Image Category, see below
- `@loaders.gl/core`: `loader.loadAndParse` deprecated.

### @loaders.gl/images
- **Image Category** now defined
    - Now have a separate micro loader for each format: `JPEGLoader`, `PNGLoader`, `GIFLoader`, `BMPLoader`, `SVGLoader`
    - Category ensures interchangability
    - Composite loader (Array) `ImageLoaders` for easy registration.
    - No longer uses `loadAndParse`, even loads from URLs are blobified and object URL:ed.
- `options.image` contain common options that apply across the category
    - Ability to control loaded image format `options.image.format`, default `auto`
    - Worker Image Loaders on Chrome and Firefox `options.image.useWorkers: true`
    - Support for `Image.decode()` to ensure images are ready to go when loader promise resolves: `options.image.decodeHTML: true`

## v1.4 (In Development)

Release Date: Target mid-Nov, 2019 (alpha/beta releases will soon become available)

The 1.4 release starts to introduce loaders.gl 2.0 concepts.

### @loaders.gl/core

- **Loader Specification Updates**

  - All (non-worker) loaders are now required to expose a `parse` function (in addition to any more specialized `parseSync/parseText/parseInBatches` functions). This simplifies using loaders without `@loaders.gl/core`, which can reduce footprint in small applications.
  - All exported loader and writer objects now expose a `mimeType` field. This field is not yet used by `@loaders.gl/core` but is available for applications (e.g. see `selectLoader`).

- **Composite Loaders**

  - Loaders can call other loaders

## v1.3

Release Date: Sep 13, 2019

The 1.3 release is focused on production quality 3D tiles support, maturing the v2 glTF parser, and provides some improvements to the core API.

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

  - The `Tile3DLayer` can now be imported from `@deck.gl/geo-layers`, and no longer needs to be copied from the loaders.gl `3d-tiles` example

- **Batched 3D Model Tile Support**

  - `b3dm` tiles can now be loaded and displayed by the `Tile3DLayer` (in addition to `pnts` tiles).

- **Performance Tracking**

  - `Tileset3D` now contain a `stats` object which tracks the loading process to help profile big tilesets.
  - Easily displayed in your UI via the `@probe.gl/stats-widget` module (see 3d-tiles example).

- **Request Scheduling**
  - The `Tileset3D` class now cancels loads for not-yet loaded tiles that are no longer in view).
  - Scheduling dramatically improves loading performance when panning/zooming through large tilesets.

### @loaders.gl/gltf

- **Version 2 Improvements**
  - Select the new glTF parser by passing `options.gltf.parserVersion: 2` to the `GLTFLoader`.
  - Many improvements to the v2 glTF parser.

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
