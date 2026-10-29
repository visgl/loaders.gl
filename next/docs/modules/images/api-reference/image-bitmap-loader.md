Image loader

# Decode pixels into the browser’s portable image type.

`ImageBitmapLoader` is the preferred image loader for new code. It turns common encoded image files into `ImageBitmap` values in supported browsers and through the loaders.gl polyfill path under Node.js.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)[Image utilities](https://loaders.gl/next/docs/modules/images/api-reference/parsed-image-api.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/parsed-image-api.md)

The image path

## Read encoded bytes. Decode once. Hand pixels to the application.

The loader keeps environment-specific decoding at the boundary. Applications can use the same output shape in rendering, analysis, and image conversion code.

01

Input

PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, or SVG

02

Decode

Browser \`createImageBitmap\` or Node polyfill

03

Output

An \`ImageBitmap\` value

04

Next step

Read pixels with \`getImageData\` or render directly

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The preferred image loader for new code. `ImageBitmapLoader` returns `ImageBitmap` in supported browsers and under Node.js when `@loaders.gl/core/polyfills` is installed.

Detailed guide

## Decode and portability details

The reference below covers supported image formats, output behavior, browser options, Node.js polyfills, and portability limitations.

| ImageBitmapLoader |                                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| File Extension    | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg` |
| File Type         | Binary                                                                    |
| File Format       | PNG, JPEG, GIF, WEBP, AVIF, BMP, SVG                                      |
| Data Format       | `ImageBitmap`                                                             |
| Supported APIs    | `load`, `parse`                                                           |
| Worker Thread     | ❌ No (but may run on separate native thread in browsers)                 |
| Streaming         | ❌ No                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import '@loaders.gl/core/polyfills'; // only needed if using under Node

import {ImageBitmapLoader} from '@loaders.gl/images';

import {load} from '@loaders.gl/core';



const image = await load(url, ImageBitmapLoader, options);
```

## Data Format[​](#data-format "Direct link to Data Format")

`ImageBitmapLoader` parses binary encoded images (such as JPEG or PNG images) into:

* `ImageBitmap` in browsers with `createImageBitmap` support.
* A minimal `ImageBitmap` polyfill under Node.js via `@loaders.gl/core/polyfills`.

If application code needs raw pixels, load with `ImageBitmapLoader` and then call `getImageData(image)`.

## Options[​](#options "Direct link to Options")

| Option       | Type     | Default | Description                                                                            |
| ------------ | -------- | ------- | -------------------------------------------------------------------------------------- |
| `image.type` | `string` | unset   | Optional compatibility alias. Only `imagebitmap` is accepted. Legacy values now throw. |

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

Portability note: The exact set of `imagebitmap` options supported may depend on the browser. Node.js does not implement `createImageBitmap()` or `imagebitmap` option handling.

## Remarks[​](#remarks "Direct link to Remarks")

* In browsers without `ImageBitmap` support, `ImageBitmapLoader` throws instead of falling back to `HTMLImageElement`.
* Under Node.js, the installed `ImageBitmap` polyfill is intentionally minimal and only supports the functionality needed by `ImageBitmapLoader` and `getImageData(image)`.
* The SVG path may still use `HTMLImageElement` internally as a bridge before producing the final `ImageBitmap`.
* Node.js support requires import `@loaders.gl/core/polyfills` before installing this module.
