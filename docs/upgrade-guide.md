# Upgrade Guide

## Upgrading to v3.0

**Transpilation**

The module entry point is now only lightly transpiled for the most commonly used evergreen browsers. This change offers significant savings on bundle size. If your application needs to support older browsers such as IE 11, make sure to include `node_modules` in your babel config.

**Worker Concurrency**

Default number of worker threads for each loader has been reduced from `5` to `3` on non mobile devices and to `1` on mobile devices to reduce memory use. Generally, increasing the number of workers has diminishing returns.

**@loaders.gl/gltf**

- `GLTFScenegraph` is updated to provide modifying capabilities. Signatures of some methods have been changed to use named parameters (rather than positional parameters).
- The deprecated `GLBBuilder` class and `encodeGLTFSync` functions have now been removed.

**@loaders.gl/basis**

- Module has been moved to `@loaders.gl/textures`.

**@loaders.gl/images**

The texture API `loadImage`, `loadImageArray`, `loadImageCube` has been moved to the new `@loaders.gl/textures` module, and have been renamed to `loadImageTexture*`.

**@loaders.gl/kml**

- The `KMLLoader`, `GPXLoader`, and `TCXLoader` now require a value for `options.gis.format`. Previously, the lack of a value would return data in "raw" format, i.e. not normalized to GeoJSON. To return GeoJSON-formatted data, use `options.gis.format: 'geojson'`. Other options are `binary` and `raw`.
- The `kml.normalize` option has been deprecated. When `options.gis.format` is `geojson`, coordinates will always be in longitude-latitude ordering.

**@loaders.gl/compression**

- Sync transforms no longer supported (this enables dynamic library loading).
- Transform static members now named `run()` instead of `inflate()` and `deflate()`.
- Zstandard transforms removed due to excessive bundle size impact. Use the new `ZstdWorker` object instead.

**@loaders.gl/crypto**

- Sync hashing no longer supported (this enables dynamic library loading).
- Transform static members now named `run()` instead of `hash()`.

**@loaders.gl/loader-utils**

- `createWorker()` now creates a generic worker. For loader workers use the new `createLoaderWorker()` function.

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
