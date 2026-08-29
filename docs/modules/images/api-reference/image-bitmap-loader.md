---
title: ImageBitmapLoader
description: Decode common image files into portable ImageBitmap values.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Image loader"
  title="Decode pixels into the browser’s portable image type."
  description="`ImageBitmapLoader` is the preferred image loader for new code. It turns common encoded image files into `ImageBitmap` values in supported browsers and through the loaders.gl polyfill path under Node.js."
  tone="orange"
  meta={['PNG, JPEG, WebP, AVIF', 'ImageBitmap output', 'Browser and Node.js']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'Image category', to: '/docs/specifications/category-image'},
    {label: 'Image utilities', to: '/docs/modules/images/api-reference/parsed-image-api'}
  ]}
/>

<DocOrientation
  eyebrow="The image path"
  title="Read encoded bytes. Decode once. Hand pixels to the application."
  description="The loader keeps environment-specific decoding at the boundary. Applications can use the same output shape in rendering, analysis, and image conversion code."
  tone="orange"
  items={[
    {label: 'Input', value: 'PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, or SVG'},
    {label: 'Decode', value: 'Browser `createImageBitmap` or Node polyfill'},
    {label: 'Output', value: 'An `ImageBitmap` value'},
    {label: 'Next step', value: 'Read pixels with `getImageData` or render directly'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The preferred image loader for new code. `ImageBitmapLoader` returns `ImageBitmap` in supported browsers and under Node.js when `@loaders.gl/polyfills` is installed.

<ReferenceBoundary
  title="Decode and portability details"
  description="The reference below covers supported image formats, output behavior, browser options, Node.js polyfills, and portability limitations."
  tone="orange"
/>

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg` |
| File Type      | Binary                                                                    |
| File Format    | PNG, JPEG, GIF, WEBP, AVIF, BMP, SVG                                      |
| Data Format    | `ImageBitmap`                                                             |
| Supported APIs | `load`, `parse`                                                           |
| Worker Thread  | No (but may run on separate native thread in browsers)                    |
| Streaming      | No                                                                        |

## Usage

```typescript
import '@loaders.gl/polyfills'; // only needed if using under Node
import {ImageBitmapLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

const image = await load(url, ImageBitmapLoader, options);
```

## Data Format

`ImageBitmapLoader` parses binary encoded images (such as JPEG or PNG images) into:

- `ImageBitmap` in browsers with `createImageBitmap` support.
- A minimal `ImageBitmap` polyfill under Node.js via `@loaders.gl/polyfills`.

If application code needs raw pixels, load with `ImageBitmapLoader` and then call `getImageData(image)`.

## Options

| Option       | Type     | Default | Description                                                                            |
| ------------ | -------- | ------- | -------------------------------------------------------------------------------------- |
| `image.type` | `string` | unset   | Optional compatibility alias. Only `imagebitmap` is accepted. Legacy values now throw. |

### ImageBitmap Options

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

## Remarks

- In browsers without `ImageBitmap` support, `ImageBitmapLoader` throws instead of falling back to `HTMLImageElement`.
- Under Node.js, the installed `ImageBitmap` polyfill is intentionally minimal and only supports the functionality needed by `ImageBitmapLoader` and `getImageData(image)`.
- The SVG path may still use `HTMLImageElement` internally as a bridge before producing the final `ImageBitmap`.
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
