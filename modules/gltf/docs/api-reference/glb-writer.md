# GLBWriter

The `GLBWriter` is a writer for the GLB binary "envelope".

Note: applications that want to encode GLB-formatted glTF files use the `GLTFWriter` instead. The `GLBWriter` is intended to be used to save custom data that combines JSON and binary resources.

| Loader                | Characteristic                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.glb`                                                                                                  |
| File Type             | Binary                                                                                                  |
| Data Format           | See below                                                                                               |
| File Format           | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Encoder Type          | Synchronous                                                                                             |
| Worker Thread Support | No                                                                                                      |
| Streaming Support     | No                                                                                                      |

## Usage

```js
import {GLBWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLBWriter, options);
```

## Options

| Option  | Type   | Default | Description                              |
| ------- | ------ | ------- | ---------------------------------------- |
| `magic` | Number | glTF    | The magic number to be save in the file. |

## Data Format

See `GLBLoader`.

| Field     | Type          | Default | Description                      |
| --------- | ------------- | ------- | -------------------------------- |
| `magic`   | `Number`      | glTF    | The first four bytes of the file |
| `version` | `Number`      | `2`     | The version number               |
| `json`    | `Object`      | `{}`    | The JSON chunk                   |
| `binary`  | `ArrayBuffer` | `null`  | The binary chunk                 |
