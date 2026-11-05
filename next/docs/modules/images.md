Image module

# Use the image representation the next stage understands.

The images module detects and loads common image payloads using loaders.gl conventions, with separate APIs for parsed images, binary metadata, browser bitmaps, and writing.

[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)[Image loader](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)

Two useful boundaries

## Inspect bytes first. Decode pixels only when needed.

Applications can identify image type and dimensions from binary data, or ask for a parsed image when they need pixels. Keeping those paths separate avoids unnecessary decoding.

01

Binary API

Detect type and dimensions from bytes

02

Parsed API

Work with ImageBitmap and decoded pixels

03

Loader

Use the standard load and worker integration

04

Writer

Encode supported image representations

The `@loaders.gl/images` module provides image, compressed texture, HDR, texture manifest, and video loaders. Image decoding works in browsers and Node.js with an optional codec; video loading requires browser media APIs.

See [Image Loaders](https://loaders.gl/next/docs/specifications/category-image.md) for the shared category conventions.

Detailed guide

## Image loading and representation APIs

The sections below cover installation, loaders and writers, parsed image helpers, and binary image inspection.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/images

npm install @loaders.gl/core
```

## API[​](#api "Direct link to API")

| Loader                                                                                                       | Description                                          |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md)              | Preferred pure `ImageBitmap` loader                  |
| [`LegacyImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/legacy-image-loader.md) | Deprecated compatibility loader                      |
| [`ImageWriter`](https://loaders.gl/next/docs/modules/images/api-reference/image-writer.md)              | Encodes decoded images into supported image formats. |

### Binary Image API[​](#binary-image-api "Direct link to Binary Image API")

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before an image loader parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                            | Description                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `getBinaryImageMetadata(imageData)` | Detects the MIME type and dimensions of supported encoded image bytes; returns `null` when detection fails. |

Use this metadata helper instead of the removed `isBinaryImage`, `getBinaryImageMIMEType`, and `getBinaryImageSize` exports.

### Parsed Image API[​](#parsed-image-api "Direct link to Parsed Image API")

A set of functions to work with parsed images returned by `ImageLoader`, deprecated `LegacyImageLoader`, and other image-category APIs.

| Function                                        | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                   |
| `getDefaultImageType() : string`                | Returns the preferred image type for the current run-time environment                        |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                        |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image         |

## Image Types[​](#image-types "Direct link to Image Types")

The parsed image APIs support multiple image representations.

* `ImageBitmap` - The preferred return type of `ImageLoader`.
* `Image` (aka `HTMLImageElement`) - Still supported by helper APIs such as `getImageData`, and remains available through deprecated `LegacyImageLoader`.
* `data` - Raw binary memory representing the image pixels. This remains supported by helper APIs and can be produced from images with `getImageData(image)`.

Prefer [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md) for new code. See deprecated [`LegacyImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/legacy-image-loader.md) for compatibility behavior and legacy options.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/images/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

## Texture and video loaders[​](#texture-and-video-loaders "Direct link to Texture and video loaders")

The images package also owns texture and video loaders. Its root exports metadata; async core APIs preload implementations when needed:

Browse [texture formats and APIs](https://loaders.gl/next/docs/modules/images/textures.md) or [video loading and GIF writing](https://loaders.gl/next/docs/modules/images/video.md).

```
import {load} from '@loaders.gl/core';

import {ImageLoader, BasisLoader, TextureLoader, VideoLoader} from '@loaders.gl/images';



const imageBitmap = await load('image.png', ImageLoader);
```

Direct parser access uses flat subpaths and `*WithParser` exports. For example, `BasisLoaderWithParser` is available from `@loaders.gl/images/basis-loader`. Texture writers use direct subpaths such as `@loaders.gl/images/ktx2-basis-writer`; manifest schemas use `@loaders.gl/images/texture-manifest-schema`.

### Direct parser and sync access[​](#direct-parser-and-sync-access "Direct link to Direct parser and sync access")

Direct access does not make an asynchronous loader synchronous. `ImageLoaderWithParser` and `BasisLoaderWithParser` still decode asynchronously. NPY arrays now belong to [scientific](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md). Import `NPYLoaderWithParser` from `@loaders.gl/scientific/npy-loader` for synchronous array parsing.

## Node image codecs[​](#node-image-codecs "Direct link to Node image codecs")

Install the optional Sharp peer to decode or encode images under Node.js:

```
npm install @loaders.gl/images @loaders.gl/core sharp
```

```
import '@loaders.gl/core/polyfills';

import {ImageLoader} from '@loaders.gl/images';
```

The Node backend detects formats from encoded bytes and returns RGBA pixels through an `ImageBitmap` wrapper. It supports PNG, JPEG, GIF, WebP, AVIF, TIFF, and SVG. Browser support remains platform-dependent. The Node wrapper supports pixel access and `close()`; it is not a full browser canvas or transferable bitmap implementation. Sharp is loaded only when Node image decoding or encoding is requested.

## Format guides[​](#format-guides "Direct link to Format guides")

* [Basis Universal](https://loaders.gl/next/docs/modules/images/textures/formats/basis.md)
* [Compressed Textures](https://loaders.gl/next/docs/modules/images/textures/formats/compressed-textures.md)
* [Crunch texture](https://loaders.gl/next/docs/modules/images/textures/formats/crunch.md)
* [DDS texture](https://loaders.gl/next/docs/modules/images/textures/formats/dds.md)
* [Radiance HDR](https://loaders.gl/next/docs/modules/images/textures/formats/hdr.md)
* [KTX and KTX2 formats](https://loaders.gl/next/docs/modules/images/textures/formats/ktx.md)
* [PVR texture](https://loaders.gl/next/docs/modules/images/textures/formats/pvr.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->50<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format | Import subpath                                         |
| ------ | ------------------------------------------------------ |
|        | `@loaders.gl/images/basis-format-utils`                |
|        | `@loaders.gl/images/basis-loader`                      |
|        | `@loaders.gl/images/basis-loader-types`                |
|        | `@loaders.gl/images/basis-module-loader`               |
|        | `@loaders.gl/images/basis-types`                       |
|        | `@loaders.gl/images/basis-worker-node.cjs`             |
|        | `@loaders.gl/images/basis-worker-node.js`              |
|        | `@loaders.gl/images/basis-worker.js`                   |
|        | `@loaders.gl/images/bundled`                           |
|        | `@loaders.gl/images/compressed-texture-loader`         |
|        | `@loaders.gl/images/compressed-texture-loader-types`   |
|        | `@loaders.gl/images/compressed-texture-worker.js`      |
|        | `@loaders.gl/images/compressed-texture-writer`         |
|        | `@loaders.gl/images/crunch-loader`                     |
|        | `@loaders.gl/images/crunch-module-loader`              |
|        | `@loaders.gl/images/crunch-worker.js`                  |
|        | `@loaders.gl/images/gif-builder`                       |
|        | `@loaders.gl/images/gl-extensions`                     |
|        | `@loaders.gl/images/image-format`                      |
|        | `@loaders.gl/images/image-loader`                      |
|        | `@loaders.gl/images/image-loader-types`                |
|        | `@loaders.gl/images/image-writer`                      |
|        | `@loaders.gl/images/ktx2-basis-writer`                 |
|        | `@loaders.gl/images/ktx2-basis-writer-worker-loader`   |
|        | `@loaders.gl/images/ktx2-basis-writer-worker-node.cjs` |
|        | `@loaders.gl/images/ktx2-basis-writer-worker-node.js`  |
|        | `@loaders.gl/images/ktx2-basis-writer-worker.js`       |
|        | `@loaders.gl/images/legacy-image-loader`               |
|        | `@loaders.gl/images/legacy-image-loader-types`         |
|        | `@loaders.gl/images/load-image`                        |
|        | `@loaders.gl/images/load-image-array`                  |
|        | `@loaders.gl/images/load-image-cube`                   |
|        | `@loaders.gl/images/radiance-hdr-loader`               |
|        | `@loaders.gl/images/radiance-hdr-loader-types`         |
|        | `@loaders.gl/images/texture-array-loader`              |
|        | `@loaders.gl/images/texture-array-loader-types`        |
|        | `@loaders.gl/images/texture-cube-array-loader`         |
|        | `@loaders.gl/images/texture-cube-array-loader-types`   |
|        | `@loaders.gl/images/texture-cube-loader`               |
|        | `@loaders.gl/images/texture-cube-loader-types`         |
|        | `@loaders.gl/images/texture-format`                    |
|        | `@loaders.gl/images/texture-loader`                    |
|        | `@loaders.gl/images/texture-loader-types`              |
|        | `@loaders.gl/images/texture-manifest-schema`           |
|        | `@loaders.gl/images/texture-manifest.schema.json`      |
|        | `@loaders.gl/images/types`                             |
|        | `@loaders.gl/images/unbundled`                         |
|        | `@loaders.gl/images/video-format`                      |
|        | `@loaders.gl/images/video-loader`                      |
|        | `@loaders.gl/images/video-loader-types`                |
