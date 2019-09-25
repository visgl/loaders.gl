# GLBWriter

The `GLBWriter` is a writer for the GLB binary "envelope".

Note: applications that want to encode GLB-formatted glTF files use the `GLTFWriter` instead. The `GLBWriter` is intended to be used to save custom data that combines JSON and binary resources.

| Loader          | Characteristic                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                  |
| File Type       | Binary                                                                                                  |
| Data Format     | See below                                                                                               |
| File Format     | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Supported APIs  | `encode`, `encodeSync`                                                                                  |

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
