# ImageLoader

An image loader that returns `ImageBitmap` in supported browsers and raw image data under Node.js (requires `@loaders.gl/polyfills`).

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg` |
| File Type      | Binary                                                                    |
| File Format    | PNG, JPEG, GIF, WEBP, AVIF, BMP, SVG                                      |
| Data Format    | `ImageBitmap` in browsers, "image data" in Node.js                        |
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

The `ImageLoader` parses binary encoded images (such as JPEG or PNG images) into:

- `ImageBitmap` in browsers with `createImageBitmap` support.
- An "image data object" under Node.js via `@loaders.gl/polyfills`.

If browser code needs raw pixels, load with `ImageLoader` and then call `getImageData(image)`.

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

Portability note: The exact set of `imagebitmap` options supported may depend on the browser.

## Remarks

- In browsers without `ImageBitmap` support, `ImageLoader` throws instead of falling back to `HTMLImageElement`.
- While generic, the `ImageLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js.
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
