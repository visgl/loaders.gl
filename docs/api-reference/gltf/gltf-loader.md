# GLTFLoader

Parses a glTF file into a hierarchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.

Also, certain glTF extensions can be fully or partially processed during loading. See [glTF Extensions](docs/api-reference/gltf-loaders/gltf-extensions.md).

| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extensions       | `.glb`, `.gltf` |
| File Type             | Binary, JSON, Linked Assets |
| File Format           | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Data Format           | [Scenegraph](/docs/specifications/category-scenegraph) |
| Decoder Type          | Synchronous (limited), Asynchronous |
| Worker Thread Support | No              |
| Streaming Support     | No              |


## Usage

```
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLTFLoader);
```

To decompress Draco-compressed meshes:

```
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
const gltf = load(url, GLTFLoader, {DracoLoader, decompress: true});
```

## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `fetchLinkedResources` | Boolean  | `true`      | Fetch any linked .BIN files, decode base64 encoded URIS. Only supported in asynchronous parsing. |
| `fetch`                | Function | `fetch` | Function used to fetch linked resources. |
| `decompress`           | Boolean  | `true`      | Decompress Draco compressed meshes (if DracoLoader available). |
| `DracoLoader`          | [DracoLoader](/docs/api-reference/draco/draco-loader) | `null`      | Supply to enable decoding of Draco compressed meshes. |
| `postProcess`          | Boolean  | `false`     | Perform additional post processing to simplify use in WebGL libraries. |
| `createImages`         | Boolean  | `false`     | Create image objects from loaded image data. |

## Modes

When parsed asynchronously (e.g. not using `parseSync`):

- linked binary resources will be loaded and resolved (if url is available).
- base64 encoded binary data inside the JSON payload will be decoded
