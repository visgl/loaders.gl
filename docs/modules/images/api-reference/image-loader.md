# ImageLoader

<p class="badges">
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
