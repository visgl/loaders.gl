# Upgrade Guide

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
