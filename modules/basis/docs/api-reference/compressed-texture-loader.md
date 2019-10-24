# CompressedTextureLoader (Experimental)

Loader for compressed Texture Files.

| Loader         | Characteristic                                             |
| -------------- | ---------------------------------------------------------- |
| File Extension | `.dds`, `.pvr`                                             |
| File Type      | Binary                                                     |
| File Format    | Compressed Texture                                         |
| Data Format    | Array of `{compressed: true, format, width, height, data}` |
| Supported APIs | `load`, `parse`                                            |

## Usage

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {CompressedTextureLoader} from '@loaders.gl/basis';
import {load} from '@loaders.gl/core';

const images = await load(url, CompressedTextureLoader, options);
```

## Data Format

Returns an array of image objects representing mip levels.

## Options

| Option       | Type   | Default  | Description                                                                  |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------- |
| `image.type` | String | `'auto'` | Set to `imagebitmap`, `html` or `ndarray` to control type of returned image. |

In addition, for `imagebitmap` type images, it is possible to pass through options to [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap) to control image extraction, via the separate `options.imagebitmap` object.

## Remarks

- While generic, the `CompressedTextureLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
