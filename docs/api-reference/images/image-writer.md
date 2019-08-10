# ImageWriter

The `ImageWriter` class can encode an image into `ArrayBuffer` both under browser and Node.js

| Loader         | Characteristic |
| -------------- | -------------- |
| File Extension | `.png`, `.jpg`, `.jpeg`  |
| File Format    | Binary         |
| Input Format   | `ArrayBuffer`         |
| Output Format  | Image          |
| Encoder Type   | Asynchronous   |
| Worker Thread  | No             |
| Streaming      | No             |

## Usage

```js
import '@loaders.gl/polyfill';  // only if using under Node
import {ImageWriter} from '@loaders.gl/images';
import {encode} from '@loaders.gl/core';

const image = await encode(arrayBuffer, ImageWriter, options);
```

## Options


| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `type`        | String    | `'png'`     | image type \*     |

\* Supported image types (MIME types) depends on the environment. Typically PNG and JPG are supported.
