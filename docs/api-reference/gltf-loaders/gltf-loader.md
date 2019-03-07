# GLTFLoader (@loaders.gl/gltf)

Parses a glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries.

| Loader                     | Characteristic |
| ---                        | ---            |
| File Extension             | `.glb`,`.gltf` |
| File Type                  | Binary         |
| File Format                | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Parser Category            | glTF Scenegraph |
| Parser Type                | Asynchronous (Synchronous w/ limited functionality) |
| Worker Thread Support      | Not yet        |
| Streaming Support          | No             |


## Usage

```
import {loadFile} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
const gltf = await loadFile(url, GLTFLoader);
```

## Options

* `DracoEncoder` - supply this to enable decoding of Draco compressed meshes. `import {DracoEncoder} from '@loaders.gl/draco'`


## Structure of Loaded Data

Returns a JSON object with "embedded" binary data in the form of typed javascript arrays.


## Attributions

The `GLTFLoader` was written specifically for loaders.gl.


## Additional Information

Can load both binary `.glb` files and JSON `.gltf` files.

When parsed asynchronously (not using `loadSync` or `parseSync`):
* linked binary resources will be loaded and resolved (if url is available).
* base64 encoded binary data inside the JSON payload will be decoded

To support decoding of Draco compressed meshes:
```
import {loadFile} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoDecoder} from '@loaders.gl/draco';
const gltf = loadFile(url, GLTFLoader, {DracoDecoder});
```
