# ImageLoader

An image loader that works under both Node.js (requires `@loaders.gl/polyfills`) and the browser.

| Loader         | Characteristic                                                   |
| -------------- | ---------------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg` |
| File Type      | Binary                                                           |
| File Format    | Image                                                            |
| Data Format    | `ImageBitmap`, `Image` (older browsers) or ndarray (node.js)     |
| Supported APIs | `load`, `parse` |

## Usage

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {ImageLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

const image = await load(url, ImageLoader, options);
```

## Options

| Option | Type | Default | Description |
| -------------- | ------- | -------- | ---------------------------------------------------------------------------- |
| `image.type` | String | `'auto'` | Set to `imagebitmap`, `html` or `ndarray` to control type of returned image. |
| `image.decode` | boolean | `true` | Ensures `html` type images are fully decoded before promise resolves. |

## Remarks

- While generic, the `ImageLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
