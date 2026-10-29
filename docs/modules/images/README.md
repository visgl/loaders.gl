---
title: Image module
description: Load image files into browser and Node.js-friendly image representations.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Image module"
  title="Use the image representation the next stage understands."
  description="The images module detects and loads common image payloads using loaders.gl conventions, with separate APIs for parsed images, binary metadata, browser bitmaps, and writing."
  tone="pink"
  meta={['Browser and Node.js', 'ImageBitmap', 'Binary image metadata']}
  links={[
    {label: 'Image category', to: '/docs/specifications/category-image'},
    {label: 'Image loader', to: '/docs/modules/images/api-reference/image-loader'}
  ]}
/>

<DocOrientation
  eyebrow="Two useful boundaries"
  title="Inspect bytes first. Decode pixels only when needed."
  description="Applications can identify image type and dimensions from binary data, or ask for a parsed image when they need pixels. Keeping those paths separate avoids unnecessary decoding."
  tone="pink"
  items={[
    {label: 'Binary API', value: 'Detect type and dimensions from bytes'},
    {label: 'Parsed API', value: 'Work with ImageBitmap and decoded pixels'},
    {label: 'Loader', value: 'Use the standard load and worker integration'},
    {label: 'Writer', value: 'Encode supported image representations'}
  ]}
/>

The `@loaders.gl/images` module provides image, compressed texture, HDR, texture manifest,
and video loaders. Image decoding works in browsers and Node.js with an optional codec;
video loading requires browser media APIs.

See [Image Loaders](/docs/specifications/category-image) for the shared category conventions.

<ReferenceBoundary
  title="Image loading and representation APIs"
  description="The sections below cover installation, loaders and writers, parsed image helpers, and binary image inspection."
  tone="pink"
/>

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                                        | Description                         |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| [`ImageLoader`](/docs/modules/images/api-reference/image-loader) | Preferred pure `ImageBitmap` loader |
| [`LegacyImageLoader`](/docs/modules/images/api-reference/legacy-image-loader)              | Deprecated compatibility loader     |
| [`ImageWriter`](/docs/modules/images/api-reference/image-writer)              | Encodes decoded images into supported image formats. |

### Binary Image API

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before an image loader parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function | Description |
| --- | --- |
| `getBinaryImageMetadata(imageData)` | Detects the MIME type and dimensions of supported encoded image bytes; returns `null` when detection fails. |

Use this metadata helper instead of the removed `isBinaryImage`,
`getBinaryImageMIMEType`, and `getBinaryImageSize` exports.

### Parsed Image API

A set of functions to work with parsed images returned by `ImageLoader`, deprecated `LegacyImageLoader`, and other image-category APIs.

| Function                                        | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isImageTypeSupported(type : string) : boolean` | Check if type is supported by current run-time environment                                   |
| `getDefaultImageType() : string`                | Returns the preferred image type for the current run-time environment                        |
| `isImage(image : any) : boolean`                | Checks any JavaScript value to see if it is an image of a type that loaders.gl can work with |
| `getImageType(image : any) : string`            | Returns the type name for this image.                                                        |
| `getImageData(image : any) : object`            | Returns an image data object with a `data` array representing the pixels of an image         |

## Image Types

The parsed image APIs support multiple image representations.

- `ImageBitmap` - The preferred return type of `ImageLoader`.
- `Image` (aka `HTMLImageElement`) - Still supported by helper APIs such as `getImageData`, and remains available through deprecated `LegacyImageLoader`.
- `data` - Raw binary memory representing the image pixels. This remains supported by helper APIs and can be produced from images with `getImageData(image)`.

Prefer [`ImageLoader`](/docs/modules/images/api-reference/image-loader) for new code. See deprecated [`LegacyImageLoader`](/docs/modules/images/api-reference/legacy-image-loader) for compatibility behavior and legacy options.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/images/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).

## Texture and video loaders

The images package also owns texture and video loaders. Its root exports metadata;
async core APIs preload implementations when needed:

```typescript
import {load} from '@loaders.gl/core';
import {ImageLoader, BasisLoader, TextureLoader, VideoLoader} from '@loaders.gl/images';

const imageBitmap = await load('image.png', ImageLoader);
```

Direct parser access uses flat subpaths and `*WithParser` exports. For example,
`BasisLoaderWithParser` is available from `@loaders.gl/images/basis-loader`.
Texture writers use direct subpaths such as `@loaders.gl/images/ktx2-basis-writer`;
manifest schemas use `@loaders.gl/images/texture-manifest-schema`.

### Direct parser and sync access

Direct access does not make an asynchronous loader synchronous. `ImageLoaderWithParser`
and `BasisLoaderWithParser` still decode asynchronously. For a loader that supports
sync parsing, use its parser entry point explicitly:

```typescript
import {parseSync} from '@loaders.gl/core';
import {NPYLoaderWithParser} from '@loaders.gl/images/npy-loader';

const tile = parseSync(arrayBuffer, NPYLoaderWithParser);
```

## Node image codecs

Install the optional Sharp peer to decode or encode images under Node.js:

```sh
npm install @loaders.gl/images @loaders.gl/core sharp
```

```typescript
import '@loaders.gl/core/polyfills';
import {ImageLoader} from '@loaders.gl/images';
```

The Node backend detects formats from encoded bytes and returns RGBA pixels through
an `ImageBitmap` wrapper. It supports PNG, JPEG, GIF, WebP, AVIF, TIFF, and SVG.
Browser support remains platform-dependent. The Node wrapper supports pixel access
and `close()`; it is not a full browser canvas or transferable bitmap implementation.
Sharp is loaded only when Node image decoding or encoding is requested.
