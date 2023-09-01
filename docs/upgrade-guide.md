# Upgrade Guide

## Upgrading to Node.js v18+

loaders.gl v3 does not support Node.js versions higher than v16.

When using loaders.gl v4.0 on Node.js v18+, you no longer need to import the 
`@loaders.gl/polyfills` module to get access to the global `fetch()`function 

## Upgrading to loaders.gl v4.0

**Typed Loaders**

Loaders now return typed data. While this sudden injection of types into previously untyped code can generated type errors in applications that have been making the wrong assumptions about what was returned from loaders, those errors will likely be valid and should just be fixed in the application.

In the interest of offering the most rigorous typing of returned data, some loaders now offer fewer options for the returned data type, and the trend in loaders.gl 3.x of offering a growing selection of return formats (or `shapes`) from each loader has now been reversed, in favor of offering a single core return data type, accompanied by optional conversion functions.

**GLTF**

- `GLTFLoader` - no longer post processes data. Applications need to import and call the `postProcessGLTF` function after calling the loader to get the same result.

**Apache Arrow JS** 

loaders.gl now uses `apache-arrow` v9. Apache Arrow JS v9 introduces breaking change (compared with Apache Arrow v4 which is used by loaders.gl v3.x_. 

If your application is using the Apache Arrow API directly to work with Apache Arrow tables returned from loaders.gl, note that the Apache Arrow v9 API contains a number of breaking changes. 

On the upside, the new Apache Arrow API is more modular and "tree shakeable" (meaning that only the Apache Arrow functionality your application is actually using is included in your application bundle). 

Unfortunately, Apache Arrow JS does yet not come with great release or upgrade notes, however the changes are fairly superficial and relatively easy to work through.

**Table Schemas** 

If you are referencing table schemas returned by loaders, they will no longer be Apache Arrow schemas, but instead equivalent "serialized" loaders.gl schemas. You can recover an Arrow schema as follows

```typescript
import {deserializeArrowSchema} from '@loaders.gl/schema-utils`;
const table = load(url, ParquetLoader);
const arrowSchema = deserializeArrowSchema(table.schema);
```

**Polyfills**

If you were relying on `@loaders.gl/polyfills` module to install a global `fetch()` 
function under Node.js that supported fetching from local files:
- You no longer need to import the `@loaders.gl/polyfills` module to get access to the global `fetch()`function 
- To fetch from local files, you now need to use `fetchFile()` instead.

```typescript
import {fetchFile} from '@loaders.gl/core';
const response = await fetchFile('/path/to/local/file');
...
```

Note that `fetchFile` is called by all core `load()` functions unless the fetch function is overridden through
loader options.

Details: The expectation is that loaders.gl v4.0+ will be used with Node.js version 18 and higher,
which now provide a built-in browser-compatible `fetch()` function by default.
This new built-in Node.js `fetch` function does not support reading from the file system,
and loaders.gl v4.0 aligns with this practice.

## Upgrading to v3.4

**@loaders.gl/wms**

This module is still marked as experimental and had some breaking changes.

- `WMSService` class
  - The `srs` parameters has been renamed to `crs` in alignment with the most recent WMS 1.3.0 conventions.
- ``WMSCapabilities` type (returned by `WMSService` and `WMSCapabilitiesLoader`)
  - `WMSCapabilities.layer` is now `WMSCapabilities.layers`
  - `WMSCapabilities.boundingBox` is now `WMSCapabilities.geographicBoundingBox` (in generic lng/lats) and `WMSCapabilities.boundingBoxes` (array of bounding boxes in supported projections)

## Upgrading to v3.2

**@loaders.gl/geopackage**

- The default data format returned is now `options.gis.format: 'tables'`, which returns the type `Tables<ObjectRowTable>`, where the `data` of each table is an array of GeoJSON features. (The `Tables` and `ObjectRowTable` types are exported from `@loaders.gl/schema`.) You can use `options.gis.format: 'geojson'` to return an object mapping table names to an array of GeoJSON features.

## Upgrading to v3.0

**Platform Support Updates**

- Node.js 10 is no longer supported (LTS maintenance of Node.js 10 ended in May 2021).
- The `module` entry point in the published module is no longer transpiled to ES5 as modern JavaScript is supported now support recent evergreen browsers resulting bundle size reduction and better performance. The `main` entry point is still fully transpiled to `es5`, you can select this entry point using e.g. the `mainField` option in webpack.

**Worker Concurrency**

Default number of worker threads for each loader has been reduced from `5` to `3` on non-mobile devices and to `1` on mobile devices to reduce memory use. Generally, increasing the number of workers has diminishing returns.

**@loaders.gl/core**

- Passing `fetch` options (such as `headers`) to `load()` and `parse()` etc. should now be done via the `options.fetch` options object (e.g. `options.fetch.headers`). Specifying `fetch` options on the root options object was deprecated in v2.3 and is no longer supported in v3.0.

**@loaders.gl/compression**

- The `Transform` API in v2.3 has been replaced with `Compression` classes that handle both compression and decompression. Please refer to the documentation.

**@loaders.gl/crypto**

- The `Transform` API in v2.3 has been replaced with `Hash` classes that handle both compression and decompression. Please refer to the documentation.

**@loaders.gl/csv**

- The format of parsed data (i.e. whether table rows are objects or arrays) is now controlled by `options.csv.shape` instead of being dynamically selected based on whether the CSV file has a header row. The default `shape` is now `object-row-table`. Default column names are generated if no header row is present. This is a breaking change when loading CSV files without header rows.
- Duplicate column names will have a counter suffix added to ensure that they are unique. In rare cases this could be a breaking change.

**@loaders.gl/gltf**

- `GLTFScenegraph` is updated to provide modifying capabilities. Signatures of some methods have been changed to use named parameters (rather than positional parameters).
- The deprecated `GLBBuilder` class and `encodeGLTFSync` functions have now been removed.

**@loaders.gl/basis**

- Module has been moved to `@loaders.gl/textures`.

**@loaders.gl/images**

- The texture API `loadImage`, `loadImageArray`, `loadImageCube` has been moved to the new `@loaders.gl/textures` module, and have been renamed to `loadImageTexture*`.
- The binary image API has been consolidated in a single function `getBinaryImageMetadata()`:
- A number of previously deprecated exports have been removed:

| Export                                 | Replacement                                             |
| -------------------------------------- | ------------------------------------------------------- |
| `isBinaryImage(arrayBuffer)`           | `Boolean(getBinaryImageMetadata(arrayBuffer))`          |
| `getBinaryImageMIMEType(arrayBuffer)`  | `getBinaryImageMetadata(arrayBuffer)?.mimeType`         |
| `getBinaryImageSize(arrayBuffer)`      | `getBinaryImageMetadata(arrayBuffer)?.{width, height}`  |
| `HTMLImageLoader`                      | Use `ImageLoader` with options `{image: type: 'image'}` |
| `getDefaultImageType()`                | N/A                                                     |
| `getSupportedImageType(imageType?)` NA |

**@loaders.gl/kml**

- The `KMLLoader`, `GPXLoader`, and `TCXLoader` now require a value for `options.gis.format`. Previously, the lack of a value would return data in "raw" format, i.e. not normalized to GeoJSON. To return GeoJSON-formatted data, use `options.gis.format: 'geojson'`. Other options are `binary` and `raw`.
- The `kml.normalize` option has been deprecated. When `options.gis.format` is `geojson`, coordinates will always be in longitude-latitude ordering.

**@loaders.gl/loader-utils**

- `createWorker()` now creates a generic worker. For loader workers use the new `createLoaderWorker()` function.

**@loaders.gl/tiles-3d-loader**

- Added `featureIds` attribute to i3s tile content. It is an array of feature ids which specify which feature each vertex belongs to. Can be used for picking functionality.

**@loaders.gl/tables**

- The (undocumented) `@loaders.gl/tables` module has been renamed to `@loaders.gl/schema`.

## Upgrading to v2.3

`@loaders.gl/core`:

- `selectLoader()` is now async and returns a `Promise` that resolves to a loader.
- `selectLoaderSync()` is available for situations when calling an async function is inconvenient.
- Passing `fetch` options to `load()` and `parse()` etc. should now be done via the `options.fetch` sub-options object. fetch options on the root object are now deprecated.

`@loaders.gl/kml`:

- The `KMLAsGeoJsonLoader` has been removed, use `KMLLoader`, with `options.gis.format: 'geojson'`.

## Upgrading to v2.2

**`@loaders.gl/core`**

- `selectLoader` is no longer experimental. If you were using the experimental export, replace `_selectLoader` with `selectLoader`. Also note that argument order has changed and now aligns with `load` and `parse`
- `parseInBatchesSync` has been removed, all batched parsing is now performed asynchronously.

Some iterator utilities that are mostly used internally have been changed.

| Function                    | Replacement / Status                  |
| --------------------------- | ------------------------------------- |
| `makeChunkIterator`         | combined into `makeIterator`          |
| `makeStreamIterator`        | combined into `makeIterator`          |
| `textDecoderAsyncIterator`  | `makeTextDecoderIterator`             |
| `lineAsyncIterator`         | `makeLineIterator`                    |
| `numberedLineAsyncIterator` | `makeNumberedLineIterator`            |
| `getStreamIterator`         | Deprecated in 2.1, now removed in 2.2 |
| `contatenateAsyncIterator`  | Deprecated in 2.1, now removed in 2.2 |

**`@loaders.gl/csv`**

- Header auto-detection now requires `options.csv.header` to be set to `'auto'` instead of `undefined`. `'auto'` is the new default value for this option, so this change is unlikely to affect applications.

**`@loaders.gl/json`**

- The experimental `json._rootObjectBatches` option is now deprecated. Use the top-level `metadata: true` option instead. Note that the `batchType` names have also changed, see the JSONLoader docs for details.

**`@loaders.gl/ply`**

The experimental streaming `_PLYStreamingLoader` has been removed. Use the non-streaming `PLYLoader` instead.

**`@loaders.gl/images`**

The new function `getBinaryImageMetadata()` replaces `isBinaryImage()`, `getBinaryImageSize()` and `getBinaryImageMIMEType()`. The old functions are now deprecated, but still available.

## Upgrading to v2.1

**`@loaders.gl/core`**

Some iterator helper functions have been renamed, the old naming is now deprecated.

| Old Name                   | New Name                 |
| -------------------------- | ------------------------ |
| `getStreamIterator`        | `makeStreamIterator`     |
| `contatenateAsyncIterator` | `concatenateChunksAsync` |

**`@loaders.gl/json`**

- Experimental exports have been removed `JSONParser`, `StreamingJSONParser`, `ClarinetParser`.

**`@loaders.gl/images`**

The experimental ImageLoaders for individual formats introduced in 2.0 have been removed, use `ImageLoader` for all formats.
`@loaders.gl/images`

- `getImageData(image)` now returns an object with `{data, width, height}` instead of just the `data` array. This small breaking change ensures that the concept of _image data_ is consistent across the API.
- `ImageLoader`: `options.image.type`: The `html` and `ndarray` image types are now deprecated and replaced with `image` and `data` respectively.

**`@loaders.gl/3d-tiles`**

`Tileset3DLoader` and `Tile3DLoader` are replaced by `Tiles3DLoader`, which supports loading both a 3D tileset file and a tile. Check `loaders.gl/3d-tiles` for loaded data format.

## Upgrading to v2.0

Version 2.0 is a major release that consolidates functionality and APIs, and a number of deprecated functions have been removed.

Some general changes:

- All exported loader and writer objects now expose a `mimeType` field. This field is not yet used by `@loaders.gl/core` but is available for applications (e.g. see `selectLoader`).
- All (non-worker) loaders are now required to expose a `parse` function (in addition to any more specialized `parseSync/parseText/parseInBatches` functions). This simplifies using loaders without `@loaders.gl/core`, which can reduce footprint in small applications.

### `@loaders.gl/core`

| Removal            | Replacement                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `TextEncoder`      | Use global `TextEncoder` instead and `@loaders.gl/polyfills` if needed |
| `TextDecoder`      | Use global `TextDecoder` instead and `@loaders.gl/polyfills` if needed |
| `createReadStream` | `fetch().then(resp => resp.body)`                                      |
| `parseFile`        | `parse`                                                                |
| `parseFileSync`    | `parseSync`                                                            |
| `loadFile`         | `load`                                                                 |

### `@loaders.gl/images`

| Removal             | Replacement                                               |
| ------------------- | --------------------------------------------------------- |
| `ImageHTMLLoader`   | `ImageLoader` with `options.images.format: 'image'`       |
| `ImageBitmapLoader` | `ImageLoader` with `options.images.format: 'imagebitmap'` |
| `decodeImage`       | `parse(arrayBuffer, ImageLoader)`                         |
| `isImage`           | `isBinaryImage`                                           |
| `getImageMIMEType`  | `getBinaryImageMIMEType`                                  |
| `getImageSize`      | `getBinaryImageSize`                                      |
| `getImageMetadata`  | `getBinaryImageMIMEType` + `getBinaryImageSize`           |

### Loader Objects

- Loaders can no longer have a `loadAndParse` method. Remove it, and just make sure you define `parse` on your loaders instead.

### `@loaders.gl/gltf`

The `GLTFLoader` now always uses the new v2 parser, and the original `GLTFParser` has been removed.

| Removal            | Replacement  |
| ------------------ | ------------ |
| `GLBParser`        | `GLBLoader`  |
| `GLBBuilder`       | `GLBWriter`  |
| `GLTFParser`       | `GLTFLoader` |
| `GLTFBuilder`      | `GLTFWriter` |
| `packBinaryJson`   | N/A          |
| `unpackBinaryJson` | N/A          |

Note that automatic packing of binary data (aka "packed JSON" support) was only implemented in the v1 `GLTFLoader` and has thus also been removed. Experience showed that packing of binary data for `.glb` files is best handled by applications.

**GLTFLoader option changes**

The foillowing top-level options are deprecated and will be removed in v2.0

| Removed Option         | Replacement                             | Descriptions                                                              |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `gltf.parserVersion`   | N/A                                     | No longer needs to be specied, only the new gltf parser is available.     |
| `fetchLinkedResources` | `gltf.fetchBuffers`, `gltf.fetchImages` |                                                                           |
| `fetchImages`          | `gltf.fetchImages`                      |                                                                           |
| `createImages`         | N/A                                     | Images are now always created when fetched                                |
| `decompress`           | `gltf.decompressMeshes`                 | Decompress Draco compressed meshes (if DracoLoader available).            |
| `DracoLoader`          | N/A                                     | Supply `DracoLoader` to `parse`, or call `registerLoaders(pDracoLoader])` |
| `postProcess`          | `gltf.postProcess`                      | Perform additional post processing before returning data.                 |
| `uri`                  | `baseUri`                               | Auto-populated when loading from a url-equipped source                    |
| `fetch`                | N/A                                     | fetch is automatically available to sub-loaders.                          |

### `@loaders.gl/draco`

| Removal        | Replacement   |
| -------------- | ------------- |
| `DracoParser`  | `DracoLoader` |
| `DracoBuilder` | `DracoWriter` |

### Loader Objects

- Loaders no longer have a `loadAndParse` removed. Just define `parse` on your loaders.

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
