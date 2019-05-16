# GLTF Loader Category

## Data Format

A gltf scenegraph is described by a parsed JSON object (with top level arrays for `scenes`, `nodes` etc) together with a list of `ArrayBuffer`s representing binary blocks into which `bufferViews` and `images` in the JSON point).

At their core glTF and GLB loaders extract this information, however additional classes are provided to make processing of the returned data easier.

While the glTF "category" is obviously quite specific glTF, loaders for other scenegraph formats (e.g. COLLADA) could potentially also choose to "convert" the loaded data to this glTF format and thus enable interoperabiity with applications that are already designed to use the `GLTFLoader`.

### GLB Data Format

An object with the following top-level fields:

| Field     | Type          | Default   | Description |
| ---       | ---           | ---       | --- |
| `magic`   | `Number`      | glTF      | The first four bytes of the file |
| `version` | `Number`      | `2`       | The version number |
| `json`    | `Object`      | `{}`      | The JSON chunk  |
| `binary`  | `ArrayBuffer` | `null`    | The binary chunk, or `null` |


### GLTF Data Format

In loaders.gl, glTF data is a pure JavaScript object with the following fields:

| Field     | Type            | Default   | Description |
| ---       | ---             | ---       | --- |
| `magic`   | `Number`        | glTF      | The first four bytes of the file |
| `version` | `Number`        | `2`       | The version number |
| `json`    | `Object`        | `{}`      | The JSON chunk (glTF formatted)  |
| `buffers` | `ArrayBuffer[]` | `[]`      | The BIN chunk plus any base64 or BIN file buffers |

Buffers can be objects with `{buffer, byteOffset, byteLength}`.


## GLTFScenegraph API

To simplify traversing and building glTF data objects, the [`GLTFScenegraph`](docs/api-reference/gltf/gltf-scenegraph) class can be used.

A gltf


A glTF data object can also be built programmatically using the GLTFScenegraph's "fluent API":

```js
import {encode} from '@loaders.gl/gltf';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
const gltfScenegraph = new GLTFScenegraph()
  .addApplicationData(...)
  .addExtras(...)
  .addExtension(...)
  .addRequiredExtension(...);

const arrayBuffer = encode(gltfScenegraph, GLTFWriter);
```

## GLTF Post Processing

The [`postProcessGLTF`](docs/api-reference/gltf/post-process-gltf) function implements a number of transformations on the loaded glTF data that would typically need to be performed by the application after loading the data, and is provided as an optional function that applications can call after loading glTF data. Refer to the reference page for details on what transformations are performed.

Context: the glTF data object returned by the GLTF loader contains the "raw" glTF JSON structure (to ensure generality and "data fidelity" reasons). However, most applications that are going to use the glTF data to visualize it in (typically in WebGL) will need to do some processing of the loaded data before using it.

## Using GLB as a "Binary Container" for Arbitrary Data

The GLB binary container format used by glTF addresses a general need to store a mix of JSON and binary data, and can potentially be used as a foundation for building custom loaders and writers.

To allow for this (and also to generally improve the glTF code structure), the `GLTFLoader` and `GLTFBuilder` classes are built on top of GLB focused classes (`GLBLoader` and `GLBBuilder`) that can be used independently of the bigger glTF classes.

## glTF Extension Support

Certain glTF extensions are fully or partially supported by the glTF classes. For details on which extensions are supported, see [glTF Extensions](docs/api-reference/gltf-loaders/gltf-extensions).

## Draco Mesh and Point Cloud Compression

Draco encoding and decoding is supported by the `GLTFBuilder` and `GLTFParser` classes but requires the DracoWriter and DracoLoader dependencies to be "injected" by the application.

```js
import {GLTFBuilder} from '@loaders.gl/gltf';
import {DracoWriter, DracoLoader} from '@loaders.gl/draco';

const gltfBuilder = new GLTFBuilder({DracoWriter, DracoLoader});
```

