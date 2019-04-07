# GLTFWriter

The `GLTFWriter` is a writer for glTF scenegraphs.

| Writer                | Characteristic                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| File Extensions       | `.glb`,`.gltf`                                                             |
| File Types            | Binary/JSON/Linked Assets                                                  |
| File Format           | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Format Category       | glTF Scenegraph                                                            |
| Writer Type           | Asynchronous (Synchronous w/ limited functionality)                        |
| Worker Thread Support | No                                                                         |
| Streaming Support     | No                                                                         |

## Usage

```js
import {GLTFWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLTFWriter);
```

## Options

- `packTypedArrays` - Packs typed arrays
- `DracoWriter` - To enable DRACO encoding, the application needs to import and supply the `DracoWriter` class.
- `DracoLoader` - To enable DRACO encoding, the application needs to import and supply the `DracoLoader` class.

## Attributions

The `GLTFWriter` was developed for loaders.gl.
