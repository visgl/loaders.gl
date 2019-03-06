# GLTFWriter

> `GLTFWriter` is still a work-in-progress. In the mean time, it is strongly recommended to directly use the `GLTFBuilder` class.

The `GLTFWriter` is a writer for glTF scenegraphs.

| Writer                     | Characteristic |
| ---                        | ---            |
| File Extensions            | `.glb`,`.gltf` |
| File Types                 | Binary/JSON/Linked Assets |
| File Format                | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Format Category            | glTF Scenegraph |
| Writer Type                | Asynchronous (Synchronous w/ limited functionality) |
| Worker Thread Support      | No             |
| Streaming Support          | No             |


## Usage

```
import {GLTFWriter} from `@loaders.gl/gltf';
import {saveFile} from `@loaders.gl/core';
const gltf = ...;
saveFile(gltf, GLTFWriter);
```

## Options

* `packTypedArrays` - Packs typed arrays
* `DracoEncoder` - To enable DRACO encoding, the application needs to import and supply the `DracoEncoder` class.
* `DracoDecoder` - To enable DRACO encoding, the application needs to import and supply the `DracoDecoder` class.


## Attributions

The `GLTFWriter` was developed for loaders.gl.
