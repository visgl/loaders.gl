# GLBWriter

The `GLBWriter` is a writer for the GLB binary "envelope" format.

Note: applications that want to encode GLB-formatted glTF files should normally use the `GLTFWriter` instead. The `GLBWriter` enables applications to save custom data that combines JSON and binary resources.

| Loader          | Characteristic                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                     |
| File Type       | Binary                                                                                                     |
| Data Format     | See below                                                                                                  |
| File Format     | [GLB v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Supported APIs  | `encode`, `encodeSync`                                                                                     |

## Usage

```js
import {GLBWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLBWriter, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    | N/A  | N/A     | N/A         |

## Data Format

See [`GLBLoader`](/modules/gltf/docs/api-reference/glb-loader.md).

## Remarks

- While the `GLBLoader` supports reading both GLB v1 and v2, only GLB v2 can be written.
