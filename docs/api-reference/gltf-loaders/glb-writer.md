# GLBWriter (Deprecated)

The `GLBWriter` is a writer for the GLB binary "envelope".

Note: applications that want to encode GLB-formatted glTF files use the `GLTFWriter` instead. The `GLBWriter` is intended to be used to save custom data that combines JSON and binary resources.

| Writer                | Characteristic                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.glb`                                                                                                  |
| File Type             | Binary                                                                                                  |
| File Format           | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Format Category       | N/A (GLB Payload)                                                                                       |
| Writer Type           | Synchronous                                                                                             |
| Worker Thread Support | No                                                                                                      |
| Streaming Support     | No                                                                                                      |

## Usage

```js
import {GLBWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLBWriter, options);
```

## Data Format

```js
{
  version: Number,
  json: Object,
  binary: ArrayBuffer
}
```

## Options

- `magic` - The first four bytes of the file

## Attributions

The `GLBWriter` was developed for loaders.gl.
