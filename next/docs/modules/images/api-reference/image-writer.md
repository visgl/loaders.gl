Image writer

# Take decoded pixels back to a file or upload body.

`ImageWriter` encodes `ImageBitmap`, `Image`, and image-data values into formats such as PNG and JPEG. The writer owns encoding while the application decides where the resulting bytes go.

[Images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

The image writing path

## Start with pixels. Choose the encoded representation.

The writer accepts the common image values produced by loaders.gl and uses the runtime’s available canvas or image encoder to produce uploadable bytes.

01

Input

ImageBitmap, Image, or image-data object

02

Format

PNG, JPEG, and environment-supported types

03

Quality

Optional JPEG or WebP quality control

04

Output

Encoded ArrayBuffer for saving or upload

The `ImageWriter` class can encode an image into `ArrayBuffer` both under browser and Node.js

Detailed guide

## Encoding and runtime details

The reference below covers accepted image values, output MIME types, quality options, browser support, and Node.js behavior.

| ImageWriter    |                                                           |
| -------------- | --------------------------------------------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`                                   |
| File Type      | Binary                                                    |
| Data Format    | `ImageBitmap`, `Image` or "image data"                    |
| File Format    | JPEG, PNG, ...                                            |
| Encoder Type   | Asynchronous                                              |
| Worker Thread  | ❌ No (but may run on separate native thread in browsers) |
| Streaming      | ❌ No                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {ImageWriter} from '@loaders.gl/images';

import {encode} from '@loaders.gl/core';



const arrayBuffer = await encode(imageData, ImageWriter, {

  image: {mimeType: 'image/png'}

});
```

`imageData` is an already decoded image. In Node.js, import `@loaders.gl/core/polyfills` before using the image adapter and save the resulting bytes with your filesystem API.

## Data Format[​](#data-format "Direct link to Data Format")

The `ImageWriter` can encode three different in-memory Image representations into binary image representation (such as JPEG or PNG images) that can then be saved or uploaded.

The supported image types are:

* `ImageBitmap`- Optimized image class on modern browsers.
* `Image` - Works on all browsers, less performant.
* "image data object" - an `ImageData` like object that hold the raw decoded bytes of an image. Works in both browsers and Node.js.

## Options[​](#options "Direct link to Options")

| Option              | Type             | Default       | Description                                                                 |
| ------------------- | ---------------- | ------------- | --------------------------------------------------------------------------- |
| `image.mimeType`    | `string`         | `'image/png'` | Encoded output MIME type supported by the runtime.                          |
| `image.jpegQuality` | `number \| null` | `null`        | Quality between `0` and `1` for JPEG/WebP; `null` uses the runtime default. |

## Remarks[​](#remarks "Direct link to Remarks")

* Supported image types (MIME types) depend on the browser / environment. As a rule, `image/png` and `image/jpeg` are always supported. (Unfortunately it is not currently clear how to determine what formats are available on any given browser, other than "trial and error").
* `jpegQuality` argument is not supported on all platforms (in which case it is assumed to have reasonable but platform-dependent defaults).
* Browser encoding uses `OffscreenCanvas.convertToBlob()` when available and falls back to `canvas.toBlob()` on the page. Worker encoding requires `OffscreenCanvas` with a 2D rendering context.
