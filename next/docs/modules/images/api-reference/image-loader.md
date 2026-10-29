Images API · compatibility loader

# Keep older image pipelines working while you migrate.

ImageLoader preserves the older environment-dependent return modes used by existing applications. New code should prefer ImageBitmapLoader, but this page explains the compatibility contract when a migration must be gradual.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[ImageBitmapLoader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)

Migration at a glance

## Know which representation your old code expects.

ImageLoader can return an ImageBitmap, an HTMLImageElement, or raw pixel data depending on options and runtime. Make that choice explicit while moving new paths to the stable bitmap-first loader.

01

Legacy modes

auto, data, imagebitmap, and image

02

Preferred path

ImageBitmapLoader plus getImageData when needed

03

Runtime

Browser-first, with Node.js polyfill support

04

Status

Compatibility API; not recommended for new code

Detailed guide

## ImageLoader compatibility reference

The sections below document supported formats, return modes, imagebitmap options, portability notes, and migration guidance.

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)![Deprecated-v4.4](https://img.shields.io/badge/Deprecated-v4.4-orange.svg?style=flat-square)

> Deprecated in 4.4. Use [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) for new code.

A compatibility image loader that preserves the older environment-dependent return types and `image.type` modes.

| ImageLoader    |                                                                           |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg` |
| File Type      | Binary                                                                    |
| File Format    | PNG, JPEG, GIF, WEBP, AVIF, BMP, SVG                                      |
| Data Format    | `ImageBitmap`, `Image`, or raw image data                                 |
| Supported APIs | `load`, `parse`                                                           |
| Worker Thread  | ❌ No (but may run on separate native thread in browsers)                 |
| Streaming      | ❌ No                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import '@loaders.gl/core/polyfills'; // only needed if using under Node

import {ImageLoader} from '@loaders.gl/images';

import {load} from '@loaders.gl/core';



const image = await load(url, ImageLoader, options);
```

## Data Format[​](#data-format "Direct link to Data Format")

`ImageLoader` parses binary encoded images (such as JPEG or PNG images) into one of the older compatibility image representations:

* `ImageBitmap`
* `Image` (aka `HTMLImageElement`)
* raw image data (`{data, width, height}`)

For new code, prefer [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) and call `getImageData(image)` when raw pixels are needed.

## Options[​](#options "Direct link to Options")

| Option         | Type     | Default  | Description                                                                                                       |
| -------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `image.type`   | `string` | `'auto'` | Compatibility mode selector. One of `auto`, `data`, `imagebitmap`, or `image`.                                    |
| `image.decode` | boolean  | `true`   | Applies to `image` loading. Waits for `HTMLImageElement.decode()` when available before the load promise settles. |

### ImageBitmap Options[​](#imagebitmap-options "Direct link to ImageBitmap Options")

Pass through options to [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap) with the top-level `options.imagebitmap` object.

| Option                             | Type   | Default     | Description                                                                                                                   |
| ---------------------------------- | ------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `imagebitmap.imageOrientation`     | string | `'none'`    | image should be flipped vertically. Either `'none'` or `'flipY'`.                                                             |
| `imagebitmap.premultiplyAlpha`     | string | `'default'` | Premultiply color channels by the alpha channel. One of `'none'`, `'premultiply'`, or `'default'`.                            |
| `imagebitmap.colorSpaceConversion` | string | `'default'` | Decode using color space conversion. Either `'none'` or `'default'` default indicates implementation-specific behavior.       |
| `imagebitmap.resizeWidth`          | number | -           | Output image width.                                                                                                           |
| `imagebitmap.resizeHeight`         | number | -           | Output image height.                                                                                                          |
| `imagebitmap.resizeQuality`        | string | `'low'`     | Algorithm to be used for resizing the input to match the output dimensions. One of pixelated, low (default), medium, or high. |

Portability note: The exact set of `imagebitmap` options supported may depend on the browser and do not apply when `ImageLoader` is used in legacy `image` or `data` modes.

## Remarks[​](#remarks "Direct link to Remarks")

* `ImageLoader` is retained for compatibility and migration.
* New applications should use [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) instead.
* If application code needs raw pixels from either loader, call `getImageData(image)`.
* Node.js support requires import `@loaders.gl/core/polyfills` before installing this module.
