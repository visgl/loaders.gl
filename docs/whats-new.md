# What's New

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td>
        <img style="max-height:200px" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/mvt-layer.jpg" />
        <p><i>MVTLoader + <a target="_blank" href="https://deck.gl/#/documentation/deckgl-api-reference/layers/mvt-layer">MVTLayer</a></i> (v2.1)</p>
      </td>
      <td>
        <img style="max-height:200px" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/terrain.jpg" />
        <p><i>TerrainLoader + <a target="_blank" href="https://deck.gl/#/documentation/deckgl-api-reference/layers/terrain-layer">TerrainLayer</a></i> (v2.1)</p>
      </td>
      <td>
        <img style="max-height:200px" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/esri-i3s.gif" />
        <p><i>I3SLoader + <a target="_blank" href="https://deck.gl/#/documentation/deckgl-api-reference/layers/tile-3d-layer">Tile3DLayer</a> + I3S</i> (v2.1)</p>
      </td>
    </tr>
  </tbody>
</table>

## v3.1 (Planning/prototyping stage)

Target Release Date: Q4 2021.

Aspirational goals:

- EcmaScript module support
- Unbundled loaders.
- More comprehensive support for `options.shape` to control output format of loaders.
- Replace `Schema` class with arrow schema if arrowjs tree-shaking improvements are satisfactory.
- New loaders: `GeoTIFFLoader`, `ZarrLoader`, `ParquetLoader`, `AVROLoader`, 
- `ffmpeg` WASM integration for `@loaders.gl/video`

**@loaders.gl/json**

- New [`NDJSONLoader`](modules/json/docs/api-reference/ndjson-loader) which handles new-line delimited JSON files.

**@loaders.gl/csv**

- The CSVLoader now recognizes TSV files via `.tsv` file extension or the `text/tab-separated-values` MIME type.

## v3.0

Release Date: July 13, 2021.

loaders.gl v3.0 is a major release, that adds a range of new loaders and features and continues the transition of the loaders.gl code base to typescript. Some deprecated APIs have been removed, check the upgrade guide for breaking changes.

**General improvements**

- New loader option: `options.<loader>.shape` to control format of data. Will gradually be supported by all loaders.
- TypeScript: improved types for many loaders.gl APIs.
- TypeScript: many loaders now export a `LoaderOptions` type that can be used to typecheck loader options, e.g `import type {CSVLoaderOptions}` from `@loaders.gl/csv`.

**@loaders.gl/core**

- New loader option: `options.mimeType` to override loader selection.
- New loader option: `options.fallbackMimeType` to control fallback loader selection.
- New loader option: `options.limit` to limit number of rows returned during batched parsing.
- New `processOnWorker()` function allows applications to run certain non-loader tasks (such as compression and decompression) on workers.

**@loaders.gl/compression**

- New compressions: `brotli`, `snappy`, `LZO` (limited).
- New `CompressionWorker` exports enable compression and decompression on worker threads using the new `processOnWorker()` function.
- Improved API (see upgrade guide)

**@loaders.gl/crypto**

- New `CryptoWorker` export enables CRC32, CRC32c and MD5 hashing on worker threads using the new `processOnWorker()` function.

**@loaders.gl/csv**

- `options.csv.type` can be explicitly set to
    + `'object-row-table'` (default) transforms rows to JS objects with the header row as keys.
    + `'array-row-table'` in which the row will be returned as an array of values.
- Duplicate column names will have a counter suffix added to ensure that they are unique.

**@loaders.gl/gis**

- Added `getSingleFeature()` function for extracting a single GeoJSON feature from a `BinaryGeometry`

**@loaders.gl/draco**

- Updated to `draco3d@1.4.1`
- Supports binary array fields in draco metadata.
- Significant performance improvements for loading and decoding.

**@loaders.gl/kml**

- `KMLLoader` - updated loader, now works under Node.js.
- `GPXLoader`, `TCXLoader` - new loaders to parse common formats for recorded GPS tracks.

**@loaders.gl/arrow**

- Upgrades `apache-arrow` version to 4.0.0

**@loaders.gl/excel** (NEW)

- New table category loader for Excel spreadsheets in both binary `.xls`, `.xlsb` and XML-based `.xlsx` formats.

**@loaders.gl/i3s**

- Thanks to a major contribution from Esri, the `I3SLoader` now offers full I3S 1.7 support including:
  + page nodes
  + compressed geometry
  + compressed textures
  + attributes (object picking)

**@loaders.gl/mvt**

- Binary output is now 2-3X faster for large datasets thanks to parsing directly from PBF to binary, rather than going through GeoJSON as an intermediate representation. Speed comparison on some example data sets (MVT tiles parsed per second):

|                    | Via GeoJSON | Direct | Speed increase |
| ------------------ | ----------- | ------ | -------------- |
| Block groups       | 2.86/s      | 5.57/s | 1.94X          |
| Census layer       | 6.09/s      | 11.9/s | 1.95X          |
| Counties Layer     | 72.5/s      | 141/s  | 1.94X          |
| Usa Zip Code Layer | 8.45/s      | 20.3/s | 2.4X           |

_Benchmarks ran using scripts on a 2012 MacBook Pro, 2.3 GHz Intel Core i7, 8 GB, measuring parsing time of MVTLoader only (network time and rendering is not included)_

- When using the MVTLoader with `binary: true` the triangulation of polygons is performed in a worker, speeding up loading of polygon geometries and easing the work on the main thread.

**@loaders.gl/terrain**

- New `options.terrain.tesselator` option in `TerrainLoader` for selecting desired method of mesh generation. Use `'martini'` for a faster method that works in most cases or `'delatin'`, which is slower but supports non-square images.

**@loaders.gl/textures** (NEW)

- [`textures`](https://loaders.gl/examples/textures) website example shows which compressed texture formats work on the current device.
- `CompressedTextureLoader` now supports KTX2, DDS and PVR containers.
- `BasisLoader` with latest binaries.
- `CrunchLoader`
- `CompressedTextureWriter` is available (for Node.js only)
- Texture loading API for multi-image-based textures `loadImageTexture`, `loadImageTextureArray`, `loadImageTextureCube`
- A new `NPYLoader` to parse N-dimensional arrays generated by the NumPy Python library for high bit depth data and image textures.

**@loaders.gl/tile-converter** (NEW)

- Thanks to a major contribution from Esri, the new `tile-converter` module implements conversion between the OGC 3D tiles and the OGC I3S tileset formats, through:
   + A `tile-converter` CLI tool for automated batch conversion of multi-terabyte tilesets.
   + A docker image to facilitate easy installs of the converter.
   + A Node.js converter class API is also available for programmatic use.
## v2.3

Release Date: October 12, 2020

This release brings a new Shapefile loader, compression codecs (Zlib, LZ4, Zstandard), support for binary output from geospatial loaders, and a range of improvements supporting loaders.gl integration with kepler.gl, a major geospatial application.

**@loaders.gl/shapefile** (NEW)

- A new loader for the ESRI Shapefile format has been added. It loads `.SHP` and (if available) `.DBF`, `.CPG` and `.PRJ` files and returns a geojson like geometry.

**@loaders.gl/compression** (NEW)

- A new module with compression/decompression transforms for compression codecs (Zlib, LZ4, Zstandard). As always, these work reliably in both browsers and Node.js.

**@loaders.gl/crypto** (NEW)

- A new module for calculating cryptographic hashes (MD5, SHA256 etc). Provided transforms enables hashes to be calculated incrementally, e.g. on incoming binary chunks while streaming data into `parseInBatches`.

**@loaders.gl/draco**

- Draco3D libraries are upgraded to version 1.3.6.
- Draco metadata can now be encoded and decoded.
- Custom Draco attributes are now decoded.

**@loaders.gl/gltf**

- `GLBLoader` can now read older GLB v1 files in addition to GLB v2.
- `GLTFLoader` now offers optional, partial support for reading older glTF v1 files and automatically converting them to glTF v2 format (via `options.glt.normalize`).

**@loaders.gl/json**

- Binary output is now available for the `GeoJsonLoader`, via `options.gis.format: 'binary'`.

**@loaders.gl/kml**

- Binary output is now available for the `KMLLoader`, via `options.gis.format: 'binary'`.

**@loaders.gl/las**

- Uses a newer version of the `laz-perf` parser (1.4.4).

**@loaders.gl/mvt**

- Binary output is now available for the Mapbox Vector Tiles `MVTLoader`, via `options.gis.format: 'binary'`.

**@loaders.gl/core**

- `parseInBatches()` now allows the caller to specify "transforms" that shoud be applied on the input data before parsing, via `options.transforms`. See the new crypto and compression modules for available transforms to calculate cryptographic hashes on / decompress "streaming" data.
- `parseInBatches()` can now be called on all loaders. Non-batched loaders will just return a single batch.
- `options.fetch` (`load`, `parse` etc.) can now be used to supply a either a `fetch` options object or a custom `fetch` function.
- (BREAKING) `selectLoader()` is now async and returns a `Promise` that resolves to a loader.
- `selectLoader()` can now select loaders through content sniffing of `Blob` and `File` objects.
- `selectLoaderSync()` has been added for situations when calling an async function is not practial.

**@loaders.gl/polyfills**

- `fetch` polyfill: Files with `.gz` extension are automatically decompressed with gzip. The extension reported in the `fetch` response has the `.gz` extension removed.
- `fetch` polyfill: Improved robustness and error handling in Node.js when opening unreadable or non-existent files. Underlying errors (`ENOEXIST`, `EISDIR` etc) are now caught and reported in `Response.statusText`.
- `Blob` and `File`, new experimental polyfills.

## v2.2

Framework and loader improvements based on usage in applications.

Release Date: June 18, 2020

### Typescript Type Definitions

Typescript type definitions (`d.ts` files) are now provided for some loaders.gl modules that export APIs (functions and classes).

### Loader Improvements

**@loaders.gl/core**

- `parseInBatches` a new `options.metadata` option adds an initial batch with metadata about what data format is being loaded.
- `selectLoader` (and `parse` etc) now recognizes unique unregistered MIME types (e.g `application/x.ply`) for every loader. This enable applications that can set `content-type` headers to have precise control over loader selection.

**@loaders.gl/images**

The `ImageLoader` now loads images as `Imagebitmap` by default on browsers that support `ImageBitmap` (Chrome and Firefox). The performance improvements are dramatic, which can be verified in the new [benchmark example](https://loaders.gl/examples/benchmarks).

**@loaders.gl/i3s**

Addresses a number of compatibility issues with different I3S tilesets that have been reported by users.

**@loaders.gl/terrain**

A new `QuantizedMeshLoader` has been added to the `terrain` module to decode the [Quantized Mesh](https://github.com/CesiumGS/quantized-mesh) format.

**@loaders.gl/video** (new loader module)

An experimental new module with video loading and GIF generation support.

**@loaders.gl/wkt**

A new `WKBLoader` has been added to the `wkt` module to decode the [Well-Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) format.

Worker support for the `WKTLoader`, designed to support future binary data improvements.

**@loaders.gl/json**

- `parseInBatches` now accepts `options.json.jsonpaths` to specify which array should be streamed using limited JSONPath syntax (e.g. `'$.features'` for GeoJSON).
- `parseInBatches` returned batches now contain a `batch.bytesUsed` field to enable progress bars.
- `parseInBatches` partial and final result batches are now generated when setting the `metadata: true` options.
- `.geojson` files can now alternatively be parsed by a new experimental `GeoJSONLoader` (exported with an underscore as `_GeoJSONLoader`), introduced to support future binary data improvements.

**@loaders.gl/csv**

- `parseInBatches` now returns a `batch.bytesUsed` field to enable progress bars.
- Header auto-detection available via `options.csv.header: 'auto'`.

**@loaders.gl/arrow**

Updated to use `apache-arrow` version `0.17.0`.

**@loaders.gl/3d-tiles**

The `Tile3DLoader` now installs the `DracoLoader`. The application no longer needs to import and register the `DracoWorkerLoader`.

**@loaders.gl/gltf**

The `GLTFLoader` now installs the `DracoLoader`. The application no longer needs to import and register the `DracoWorkerLoader`.

**@loaders.gl/polyfills**

- The `fetch` and `Response` polyfills for Node.js have been significantly improved, supporting more types of input and parameters with higher fidelity
- The `fetch` polyfill now automatically add the `accept-encoding` header and automatically decompresses `gzip`, `brotli` and `deflate` compressed responses.

## v2.1

Release Date: Mar 16, 2020

This release adds a number of new geospatial format loaders

### New Geospatial Loaders

The new loaders empowers rendering frameworks to visualize various geospatial datasets.

**@loaders.gl/i3s** (new loader module)

- A new loader module for [I3S](https://github.com/Esri/i3s-spec) tiles is added to the 3D Tiles family. Checkout the San Francisco Buildings [example](https://loaders.gl/examples/i3s). This is a collaboration with ESRI and Tamrat Belayneh [@Tamrat-B](https://github.com/Tamrat-B)

**@loaders.gl/mvt** (new loader module)

- A new loader module for loading [Mapbox Vector Tiles](https://github.com/mapbox/vector-tile-spec). Development was led by contributors from [CARTO](https://carto.com/),

**@loaders.gl/terrain** (new loader module)

- A new loader module for reconstructing mesh surfaces from height map images. Check out the [example](https://github.com/visgl/deck.gl/tree/master/examples/website/terrain) with deck.gl's [`TerrainLayer`](https://deck.gl/#/documentation/deckgl-api-reference/layers/terrain-layer).

**@loaders.gl/wkt** (new loader module)

- A new loader module for the Well-Known Text geometry format.

### Other Improvements

**@loaders.gl/core**

- The `load` and `parse` functions can now read data directly from `Stream` objects both in node and browser.

**@loaders.gl/arrow**

- The ArrowJS dependency has been upgraded to v0.16.
- The ArrowJS API documentation in the loaders.gl website has been improved.

**@loaders.gl/images**

- Images can now be loaded as data: Using the `ImageLoader` with `options.image.type: 'data'` parameter will return an _image data object_ with width, height and a typed array containing the image data (instead of an opaque `Image` or `ImageBitmap` instance).
- `ImageBitmap` loading now works reliably, use `ImageLoader` with `options.image.type: 'imagebitmap'`.

**@loaders.gl/json**

- The streaming JSON loader now has an experimental option `_rootObjectBatches` that returns the top-level JSON object containing the JSON array being streamed, as additional first (partial) and last (complete) batches.

**Mesh Category**

- Add `boundingBox` to [mesh category](/docs/specifications/category-mesh) header

## v2.0

Release Date: Dec 20, 2019

The 2.0 release brings potentially dramatic bundle size savings through dynamic loading of loaders and workers, significant overhauls to several loaders including , image loading improvements and the glTF loader, and a powerful loader composition system.

- **Loader-Specific Options** Each loader now defines its own sub object in the options object. This makes it possible to cleanly specify options for multiple loaders at the same time. This is helpful when loaders.gl auto-selects a pre-registered loader or when passing options to a sub-loader when using a composite loader.

- **Smaller Loaders** Big loaders such as `DracoLoader` and `BasisLoader` that use large libraries (e.g. WASM/WebAssembly or emscripten/C++ transpiled to JavaScript) now load those libraries dynamically from `unpkg.com` CDN resulting in dramatic bundle size savings. E.g the bundle size impact of the `DracoLoader` was reduced from > 1MB to just over 10KB.

- **Worker Loaders**

  - Ease-of-use: Worker loading is provided by the main loader objects. It is not necessary to import the `...WorkerLoader` objects to enable worker loading (but see below about bundle size)
  - Performance: Loading on worker threads is now the default: All worker enabled loaders now run on worker threads by default (set `options.worker: false` to disable worker-thread loading and run the loader on the main thread).
  - Debugging: Development builds of workers are now available on `unpkg.com` CDN, eabling debugging of worker loaders.
  - Bundle size: Workers are no longer bundled, but loaded from from the `unpkg.com` CDN.
  - Bundle size: Note that the old `...WorkerLoader` classes are still available. Using these can save even more bundle space since during tree-shaking since they do not depend on the non-worker parser.

- **Composite Loaders**
  - The new _composite loader_ architecture enables complex loaders like `Tiles3DLoader` and `GLTFLoader` to be composed from more primitive loaders without losing the ability to run some parts on worker, pass arguments to sub-loaders etc.

### New Loader Modules

- **@loaders.gl/basis** (Experimental) A new module for the basis format that enables. This module also provides a `CompressedImageLoader` for more traditional compressed images.
- **@loaders.gl/json** (Experimental) A new streaming `JSONLoader` that supports batched (i.e. streaming) parsing from standard JSON files, e.g. geojson. No need to reformat your files as line delimited JSON.

### Update Loader Modules

- `@loaders.gl/gltf` the `GLTFLoader` is now a "composite loader". The perhaps most important change is that `load(url, GLTFLoader)` also loads all sub-assets, including images, Draco compressed meshes, etc making the loaded data easier for applications to use.
- `@loaders.gl/images` see below for a list of changes

### @loaders.gl/images Updates

- **New ImageLoader options** `options: {image: {}}` contain common options that apply across the category
  - `options.image.type`, Ability to control loaded image type enabling faster `ImageBitmap` instances to be loaded via `type: 'imagebitmap`. Default `auto` setting returns traditional HTML image objects.
- Image Decoding. `options.image.decodeHTML: true` - `ImageLoader` now ensures HTML images are completely decoded and ready to be used when the image is returned (by calling `Image.decode()`).

- **Parsed Image API** Since the type of images returned by the `ImageLoader` depends on the `{image: {type: ...}}` option, a set of functions are provided to work portably with loaded images: `isImage()`, `getImageType()`, `getImageData()`, ...
- **Binary Image API** Separate API to work with unparsed images in binary data form: `isBinaryImage()`, `getBinaryImageType()`, `getBinaryImageSize()`, ...
- **"Texture" Loading API** New methods `loadImages` and `loadImageCube` can signficantly simplify loading of arrays of arrays of (mipmapped) images that are often used in 3D applications. These methods allow an entire complex of images (e.g. 6 cube faces with 10 mip images each) to be loaded using a single async call.
- **Improved Node.js support** More image test cases are now run in both browser and Node.js and a couple of important Node.js issues were uncovered and fixed.

## v1.3

Release Date: Sep 13, 2019

The 1.3 release is focused on production quality 3D tiles support, maturing the v2 glTF parser, and provides some improvements to the core API.

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/visgl/loaders.gl/master/website/static/images/example-3d-tiles.png" />
        <p><strong>Tiles3DLoader</strong></p>
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
        <img style="max-height:200px" src="https://raw.github.com/visgl/loaders.gl/master/website/static/images/example-gltf.jpg" />
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
