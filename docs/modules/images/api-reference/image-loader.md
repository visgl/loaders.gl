---
title: ImageLoader
description: Load legacy browser and raw image representations for compatibility with older applications.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Images API · compatibility loader"
  title="Keep older image pipelines working while you migrate."
  description="ImageLoader preserves the older environment-dependent return modes used by existing applications. New code should prefer ImageBitmapLoader, but this page explains the compatibility contract when a migration must be gradual."
  tone="pink"
  meta={['From v1.0', 'Deprecated in v4.4', 'Image / ImageBitmap / raw data']}
  links={[
    {label: 'Images module', to: '/docs/modules/images'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'},
    {label: 'Image category', to: '/docs/specifications/category-image'}
  ]}
/>

<DocOrientation
  eyebrow="Migration at a glance"
  title="Know which representation your old code expects."
  description="ImageLoader can return an ImageBitmap, an HTMLImageElement, or raw pixel data depending on options and runtime. Make that choice explicit while moving new paths to the stable bitmap-first loader."
  tone="pink"
  items={[
    {label: 'Legacy modes', value: 'auto, data, imagebitmap, and image'},
    {label: 'Preferred path', value: 'ImageBitmapLoader plus getImageData when needed'},
    {label: 'Runtime', value: 'Browser-first, with Node.js polyfill support'},
    {label: 'Status', value: 'Compatibility API; not recommended for new code'}
  ]}
/>

<ReferenceBoundary
  title="ImageLoader compatibility reference"
  description="The sections below document supported formats, return modes, imagebitmap options, portability notes, and migration guidance."
  tone="pink"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Deprecated-v4.4-orange.svg?style=flat-square" alt="Deprecated-v4.4" />
</p>

> Deprecated in 4.4. Use [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) for new code.

A compatibility image loader that preserves the older environment-dependent return types and `image.type` modes.

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg` |
| File Type      | Binary                                                                    |
| File Format    | PNG, JPEG, GIF, WEBP, AVIF, BMP, SVG                                      |
| Data Format    | `ImageBitmap`, `Image`, or raw image data                                 |
| Supported APIs | `load`, `parse`                                                           |
| Worker Thread  | No (but may run on separate native thread in browsers)                    |
| Streaming      | No                                                                        |

## Usage

```typescript
import '@loaders.gl/polyfills'; // only needed if using under Node
import {ImageLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

const image = await load(url, ImageLoader, options);
```

## Data Format

`ImageLoader` parses binary encoded images (such as JPEG or PNG images) into one of the older compatibility image representations:

- `ImageBitmap`
- `Image` (aka `HTMLImageElement`)
- raw image data (`{data, width, height}`)

For new code, prefer [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) and call `getImageData(image)` when raw pixels are needed.

## Options

| Option         | Type     | Default  | Description                                                                                                       |
| -------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `image.type`   | `string` | `'auto'` | Compatibility mode selector. One of `auto`, `data`, `imagebitmap`, or `image`.                                    |
| `image.decode` | boolean  | `true`   | Applies to `image` loading. Waits for `HTMLImageElement.decode()` when available before the load promise settles. |

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

Portability note: The exact set of `imagebitmap` options supported may depend on the browser and do not apply when `ImageLoader` is used in legacy `image` or `data` modes.

## Remarks

- `ImageLoader` is retained for compatibility and migration.
- New applications should use [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) instead.
- If application code needs raw pixels from either loader, call `getImageData(image)`.
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
