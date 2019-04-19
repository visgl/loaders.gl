# GLBLoader

The `GLBLoader` is a writer for GLB binary "envelope".

Note: applications that want to parse GLB-formatted glTF files use the `GLTFLoader` instead. The `GLBLoader` is intended to be used to load custom data that combines JSON and binary resources.

| Loader                | Characteristic                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.glb`                                                                                                  |
| File Types            | Binary                                                                                                  |
| File Format           | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Format Category       | N/A (GLB Payload)                                                                                       |
| Writer Type           | Synchronous                                                                                             |
| Worker Thread Support | No                                                                                                      |
| Streaming Support     | No                                                                                                      |

## Usage

```
import {load} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLBLoader);
```

## Data Format

```js
{
  magic: Number,
  version: Number,
  json: Object,
  binary: ArrayBuffer
}
```

## Options

| Option  | Default | Description                              |
| ------- | ------- | ---------------------------------------- |
| `magic` | GLTF    | The magic number to be save in the file. |

## Attributions

The `GLBLoader` was developed for loaders.gl.
