# GLTFLoader

Parses a glTF file. Can load both the `.glb` (binary) and `.gltf` (text/json) file format variants.

A glTF file contains a hierarchical scenegraph description that can be used to instantiate corresponding hierarcy of actual `Scenegraph` related classes in most WebGL libraries.

| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extensions       | `.glb`, `.gltf` |
| File Type             | Binary, JSON, Linked Assets |
| File Format           | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Data Format           | [Scenegraph](/docs/specifications/category-scenegraph) |
| Decoder Type          | Synchronous (limited), Asynchronous |
| Worker Thread Support | No              |
| Streaming Support     | No              |

The `GLTFLoader` aims to take care of as much processing as possible, while remaining framework-independent.

The GLTF Loader returns an object with a `json` field containing the glTF Scenegraph. In its basic mode, the `GLTFLoader` does not modify the loaded JSON in any way. Instead, the results of additional processing are placed in parallel top-level fields such as `buffers` and `images`. This ensures that applications that want to work with the standard glTF data structure can do so.

Optionally, the loaded gltf can be "post processed", which lightly annotates and transforms the loaded JSON structure to make it easier to use. Refer to [postProcessGLTF](docs/api-reference/gltf-loaders/gltf-extensions.md) for details.

In addition, certain glTF extensions, in particular Draco mesh encoding, can be fully or partially processed during loading. When possible (and extension processing is enabled), such extensions will be resolved/decompressed and replaced with standards conformant representations. See [glTF Extensions](docs/api-reference/gltf-loaders/gltf-extensions.md) for more information.

Note: while supported, synchronous parsing of glTF (e.g. using `parseSync()`) has significant limitations. When parsed asynchronously (using `await parse()` or `await load()`), the following additional capabilities are enabled:

- linked binary resource URI:s will be loaded and resolved (assuming a valid base url is available).
- base64 encoded binary URI:s inside the JSON payload will be decoded.
- linked image URI:s can be loaded and decoded.
- Draco meshes can be decoded asynchronously on worker threads (in parallel!).

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

| Option        | Type      | Default Async | Sync  | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `fetchLinkedResources` | Boolean  | `true`  | No | Fetch any linked .BIN files, decode base64 encoded URIS. Async only. |
| `fetchImages`          | Boolean  | `false` | No     | Fetch any referenced image files (and decode base64 encoded URIS). Async only. |
| `createImages`         | Boolean  | `false` | Create image objects from loaded image data. |
| `fetch`                | Function | `fetch` | N/A | Function used to fetch linked resources. |
| `uri`                  | String | `fetch` | N/A | Function used to fetch linked resources. |
| `decompress`           | Boolean  | `true`  | Yes | Decompress Draco compressed meshes (if DracoLoader available). |
| `DracoLoader`          | [DracoLoader](/docs/api-reference/draco/draco-loader) | `null`  | Yes\*    | Supply to enable decoding of Draco compressed meshes. \* `DracoWorkerLoader` is async only. |
| `postProcess`          | Boolean  | `false` | Perform additional [post processing](docs/api-reference/post-process-gltf) to simplify use in WebGL libraries. |



## Data Format

Returns
```json
{
  // The base URI used to load this glTF, if any. For resolving relative uris to linked resources.
  baseUri: String,

  // JSON Chunk
  json: Object,

  // Length and indices of this array will match `json.buffers`
  // The GLB bin chunk, if present, will be found in buffer 0.
  // Additional buffers are fetched or base64 decoded from the JSON uri:s.
  buffers: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number
  }],

  // Images can optionally be loaded and decoded, they will be stored here
  // Length and indices of this array will match `json.buffers`
  images: Image[],

  // GLBLoader output, if this was a GLB encoded glTF
  _glb?: Object
}
```

| Field         | Type     | Default   | Description        |
| ---           | ---      | ---       | ---                |
| `baseUri` | `String`     | ``        | length of GLB (e.g. embedded in larger binary block) |
| `json`    | `Object`     | `{}`      | Parsed JSON from the JSON chunk     |
| `buffers` | `Object[]`   | `[]`      | The version number |
| `buffers[*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk   |
| `buffers[*].byteOffset`  | `Number`  | `null`  | offset of buffer (embedded in larger binary block)   |
| `buffers[*].byteLength`  | `ArrayBuffer` | `null`  | length of buffer (embedded in larger binary block)   |
| `_glb`?     | `Object`    | N/A       | The output of the GLBLoader if the parsed file was GLB formatted |

