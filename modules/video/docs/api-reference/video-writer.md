# VideoWriter

The `VideoWriter` class can encode an video into `ArrayBuffer` both under browser and Node.js

| Loader         | Characteristic          |
| -------------- | ----------------------- |
| File Extension | `.png`, `.jpg`, `.jpeg` |
| File Format    | Binary                  |
| Data Format    | `ArrayBuffer`           |
| File Format    | Video                   |
| Encoder Type   | Asynchronous            |
| Worker Thread  | No                      |
| Streaming      | No                      |

## Usage

```js
import '@loaders.gl/polyfill'; // only if using under Node
import {VideoWriter} from '@loaders.gl/video';
import {encode} from '@loaders.gl/core';

const video = await encode(arrayBuffer, VideoWriter, options);
```

## Options

| Option | Type   | Default | Description   |
| ------ | ------ | ------- | ------------- |
| `type` | String | `'png'` | video type \* |

\* Supported video types (MIME types) depends on the environment. Typically PNG and JPG are supported.
