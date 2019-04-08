# GLTFLoader (@loaders.gl/gltf)

Parses a glTF file into a hierarchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.

| Loader                | Characteristic                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| File Extensions       | `.glb`,`.gltf`                                                             |
| File Types            | Binary/JSON/Linked Assets                                                  |
| File Format           | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Format Category       | glTF Scenegraph                                                            |
| Parser Type           | Asynchronous (Synchronous w/ limited functionality)                        |
| Worker Thread Support | No                                                                         |
| Streaming Support     | No                                                                         |

## Usage

```
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLTFLoader);
```

To decompress Draco compressed meshes:

```
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
const gltf = load(url, GLTFLoader, {DracoLoader, decompress: true});
```

## Options

- `DracoWriter` - supply this to enable decoding of Draco compressed meshes. `import {DracoWriter} from '@loaders.gl/draco'`

## Options

| Option                 | Default     | Description                                                                                      |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `fetchLinkedResources` | `true`      | Fetch any linked .BIN files, decode base64 encoded URIS. Only supported in asynchronous parsing. |
| `fetch`                | `fetchFile` | Function used to fetch linked resources                                                          |
| `decompress`           | `true`      | Decompress Draco compressed meshes (if DracoLoader available)                                    |
| `DracoLoader`          | `null`      | Supply to enable decoding of Draco compressed meshes.                                            |
| `postProcess`          | `false`     | Perform additional post processing to simplify use in WebGL libraries                            |
| `createImages`         | `false`     | Create image objects from loaded image data                                                      |

## Structure of Loaded Data

Returns a JSON object with "embedded" binary data in the form of typed javascript arrays.

When parsed asynchronously (not using `loadSync` or `parseSync`):

- linked binary resources will be loaded and resolved (if url is available).
- base64 encoded binary data inside the JSON payload will be decoded

## Attributions

The `GLTFLoader` was developed for loaders.gl.
