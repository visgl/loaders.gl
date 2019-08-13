# ImageLoader

An image loader that works under both Node.js (requires `@loaders.gl/polyfills`) and the browser.

| Loader         | Characteristic |
| -------------- | -------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg`         |
| File Type      | Binary         |
| File Format    | Image          |
| Data Format    | `Image`, `ImageBitmap` (web worker) or ndarray (node.js) |
| Decoder Type   | Asynchronous   |
| Worker Thread  | No             |
| Streaming      | No             |

## Usage

```js
import '@loaders.gl/polyfill';  // only if using under Node
import {ImageLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

const image = await load(url, ImageLoader, options);
```

## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `crossOrigin` | String    | -           | passed to [Image.crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img). |

## Remarks

- While generic, the `ImageLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
