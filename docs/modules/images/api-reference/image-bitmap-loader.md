# ImageBitmapLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The preferred image loader for new code. `ImageBitmapLoader` returns `ImageBitmap` in supported browsers and under Node.js when `@loaders.gl/polyfills` is installed.

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
