# GLBLoader

The `GLBLoader` parses a GLB binary "envelope" extracting the embedded JSON and binary chunks.

Note: applications that want to parse GLB-formatted glTF files would normally use the `GLTFLoader` instead. The `GLBLoader` can be used to load custom data that combines JSON and binary resources.

| Loader          | Characteristic                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                                                                                                                           |
| File Type       | Binary                                                                                                                                                                                                           |
| File Format     | [GLB v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification), [GLB v1](https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF) \* |
| Data Format     | See below                                                                                                                                                                                                        |
| Supported APIs  | `load`, `parse`, `parseSync`                                                                                                                                                                                     |
|                 |

\* From [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io), the `GLBLoader` can also load GLB v1 formatted files, returning a normalized GLB v2 compatible data structure, but with the `version` field set to `1`.

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

Remarks:

- Parses GLB v2 encoded data.
- Parses GLB v1 encoded data (enabling support for the glTF v1 `KHR_binary_gltf` extension). Parsed GLB v1 data is returned in the standard `GLB` format.
- Extracts multiple binary chunks if present (this is supported by the GLB specification but is not used in the glTF specification).

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
