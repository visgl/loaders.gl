# ImageWriter

The `ImageWriter` class can encode an image into `ArrayBuffer` both under browser and Node.js

| Loader         | Characteristic                                         |
| -------------- | ------------------------------------------------------ |
| File Extension | `.png`, `.jpg`, `.jpeg`                                |
| File Type      | Binary                                                 |
| Data Format    | `ImageBitmap`, `Image` or "image data"                 |
| File Format    | JPEG, PNG, ...                                         |
| Encoder Type   | Asynchronous                                           |
| Worker Thread  | No (but may run on separate native thread in browsers) |
| Streaming      | No                                                     |

## Usage

```js
import '@loaders.gl/polyfill'; // only if using under Node
import {ImageWriter} from '@loaders.gl/images';
import {encode} from '@loaders.gl/core';

const image = new Image(...);
const arrayBuffer = await encode(image, ImageWriter, {image: {mimeType: 'image/jpeg'}});
fs.writeFileSync('shiny-new-image.jpg', arrayBuffer);
```

## Data Format

The `ImageWriter` can encode three different in-memory Image representations into binary image representation (such as JPEG or PNG images) that can then be be saved or uploaded,

The supported image types are:

- `ImageBitmap`- Optimized image class on modern browsers.
- `Image` - Works on all browsers, less performant.
- "image data object" - `ImageData` like objects that hold the raw decoded bytes of an image. Works in both browsers and Node.js

## Options

| Option              | Type            | Default                                | Description                  |
| ------------------- | --------------- | -------------------------------------- | ---------------------------- |
| `image.mimeType`    | `string`        | `'image/png'`                          | image type. Depends on brows |
| `image.jpegQuality` | `number | null` | If provided and supported by browser } |

## Remarks

- Supported image types (MIME types) depend on the browser / environment. As a rule, `image/png` and `image/jpeg` are always supported. (Unfortunately it is not currently clear how to determine what formats are available on any given browser, other than "trial and error").
- `jpegQuality` argument is not supported on all platforms, in which case it will have reasonable but platform-dependent defaults.
- The `ImageWriter` currently uses [canvas.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) on browsers, so referring to related documentation might be helpful.
