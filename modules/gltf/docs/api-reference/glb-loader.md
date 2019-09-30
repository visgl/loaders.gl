# GLBLoader

The `GLBLoader` parses a GLB binary "envelope".

Note: applications that want to parse GLB-formatted glTF files use the `GLTFLoader` instead. The `GLBLoader` is intended to be used to load custom data that combines JSON and binary resources.

| Loader          | Characteristic                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                  |
| File Type       | Binary                                                                                                  |
| File Format     | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Data Format     | See below                                                                                               |
| Supported APIs  | `load`, `parse`, `parseSync`                                                                            |
|                 |

## Usage

```js
import {load} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLBLoader);
```

## Options

| Option                    | Type    | Default | Description                                                  |
| ------------------------- | ------- | ------- | ------------------------------------------------------------ |
| `glb.strict` (DEPRECATED) | Boolean | `false` | Whether to support non-standard JSON/BIN chunk type numbers. |

## Data Format

Returns

```json
{
  "header": {
    "byteLength": number,
    "byteOffset": number
  },

  "type": string,
  "version": number,

  // JSON Chunk
  "json": any,

  // BIN Chunk
  "hasBinChunk": boolean,
  "binChunks": [
    {
      "arrayBuffer": ArrayBuffer,
      "byteOffset": Number,
      "byteLength": Number
    }
  ]
}
```

| Field                       | Type          | Default | Description                                          |
| --------------------------- | ------------- | ------- | ---------------------------------------------------- |
| `type`                      | `String`      | `glTF`  | String containing the first four bytes of the file   |
| `version`                   | `Number`      | `2`     | The version number, only version 2 is supported      |
| `json`                      | `Object`      | `{}`    | Parsed JSON from the JSON chunk                      |
| `binChunks`                 | `ArrayBuffer` | `null`  | The binary chunk                                     |
| `binChunks[\*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk                                     |
| `binChunks[\*].byteOffset`  | `Number`      | `null`  | offset of BIN (e.g. embedded in larger binary block) |
| `binChunks[\*].byteLength`  | `ArrayBuffer` | `null`  | length of BIN (e.g. embedded in larger binary block) |
| `header.byteLength`         | `Number`      | -       | length of GLB (e.g. embedded in larger binary block) |
| `header.byteOffset`         | `Number`      | 0       | offset of GLB (e.g. embedded in larger binary block) |
