# ImageLoader

An image loader that works under both Node.js and the browser.

```js
import '@loaders.gl/polyfill';  // if using under Node
import {ImageLoader} from '@loaders.gl/images';
import {load} from '@loaders.gl/core';

load(url, ImageLoader, options);
```

## Options

- `crossOrigin` - passed to [Image.crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img). Only used if in browser main thread.
- `imageOrientation` - passed to [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap). Only used if in webworker.
- `premultiplyAlpha` - passed to [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap). Only used if in webworker.

## Remarks

- While generic, the `ImageLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
- Node.js support requires import `@loaders.gl/polyfills` before installing this module.
