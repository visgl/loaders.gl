# BasisLoader

An image loader that works under both Node.js (requires `@loaders.gl/polyfills`) and the browser.

| Loader         | Characteristic                  |
| -------------- | ------------------------------- |
| File Extension | `.basis`                        |
| File Type      | Binary                          |
| File Format    | Basis                           |
| Data Format    | `Array of Array of ArrayBuffer` |
| Supported APIs | `load`, `parse`                 |

## Usage

```js
import '@loaders.gl/polyfills'; // only needed if using under Node
import {ImageLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

const image = await load(url, ImageLoader, options);
```

## Options

| Option       | Type   | Default  | Description                                                                  |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------- |
| `basis.type` | String | `'auto'` | Set to `imagebitmap`, `image` or `ndarray` to control type of returned image. |

## Remarks

- While generic, the `BasisLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
