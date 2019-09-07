# GLBLoader

The `GLBLoader` parses a GLB binary "envelope".

Note: applications that want to parse GLB-formatted glTF files use the `GLTFLoader` instead. The `GLBLoader` is intended to be used to load custom data that combines JSON and binary resources.

| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extensions       | `.glb`          |
| File Type             | Binary          |
| File Format           | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Data Format           | See below       |
| Decoder Type          | Synchronous     |
| Worker Thread Support | No              |
| Streaming Support     | No              |

## Usage

```js
import {load} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLBLoader);
```


## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `magic`       | Number    | glTF        | The magic number to be save in the file. |


## Data Format

Returns
```json
{
  header: {
    type: String,
    magic: number,
    version: number,
    byteLength: number,
    byteOffset: number
  },

  // JSON Chunk
  json: any,

  // BIN Chunk
  hasBinChunk: boolean,
  binChunks: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number
  }]
}
```

| Field         | Type          | Default   | Description        |
| ---           | ---           | ---       | ---                |
| `header.type` | `String`      | `glTF`      | The first four bytes of the file |
| `header.magic`   | `Number`      | glTF      | ASCII of the first four bytes of the file |
| `header.version` | `Number`      | `2`       | The version number |
| `header.byteLength` | `Number`      | -       | length of GLB (e.g. embedded in larger binary block) |
| `header.byteOffset` | `Number`      | 0       | offset of GLB  (e.g. embedded in larger binary block) |
| `json`    | `Object`      | `{}`      | Parsed JSON from the JSON chunk     |
| `binChunks`  | `ArrayBuffer` | `null`  | The binary chunk   |
| `binChunks[0].arrayBuffer`  | `ArrayBuffer` | `null`  | The binary chunk   |
| `binChunks[0].byteOffset`  | `Number` | `null`  | offset of BIN  (e.g. embedded in larger binary block)   |
| `binChunks[0].byteLength`  | `ArrayBuffer` | `null`  |length of BIN (e.g. embedded in larger binary block)   |

