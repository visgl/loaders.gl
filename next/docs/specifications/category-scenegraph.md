Loader category

# Keep the scene hierarchy until the renderer needs it.

Scenegraph loaders preserve nodes, meshes, materials, transforms, and extensions as a structured representation. That lets applications inspect, transform, or render a scene without flattening it during decode.

[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[glTF format](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[GLTF​Loader↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)[GLB​Loader↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/glb-loader.md)

Data

[Scenegraph category dataglTF assets↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

Encode

[GLTF​Writer↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-writer.md)[GLB​Writer↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/glb-writer.md)

A scene is more than a mesh

## Decode the relationships as well as the bytes.

A scenegraph carries the hierarchy that connects geometry, materials, animations, and transforms. The category keeps those relationships available to an application-specific renderer or converter.

01

Scene files

glTF, GLB, and OpenUSD

02

Preserves

Nodes, meshes, materials, transforms, animations, and extensions

03

Payloads

Binary buffers, images, compressed geometry, and textures

04

Output

Typed scene data close to the source format

The Scenegraph category represents hierarchical 3D scene descriptions. Each loader returns a typed representation close to its source format.

Detailed guide

## The scenegraph data model

The sections below document the loaders and the source-shaped data structures they return.

## Loaders[​](#loaders "Direct link to Loaders")

| Loader                                                                                            | Notes |
| ------------------------------------------------------------------------------------------------- | ----- |
| [`GLTFLoader`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md) |       |
| [`GLBLoader`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/glb-loader.md)   |       |
| [`USDLoader`](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md)    |       |

## glTF Data Format[​](#gltf-data-format "Direct link to glTF Data Format")

The data format is fairly raw, close to the unpacked glTF/GLB data structure, it is described by:

* a parsed JSON object (with top level arrays for `scenes`, `nodes` etc)
* a list of `ArrayBuffer`s representing binary blocks (into which `bufferViews` and `images` in the JSON point).

## Data Structure[​](#data-structure "Direct link to Data Structure")

A JSON object with the following top-level fields:

| Field     | Type            | Default | Description                                              |
| --------- | --------------- | ------- | -------------------------------------------------------- |
| `magic`   | `Number`        | glTF    | The first four bytes of the file                         |
| `version` | `Number`        | `2`     | The version number                                       |
| `json`    | `Object`        | `{}`    | The JSON chunk                                           |
| `buffers` | `ArrayBuffer[]` | `[]`    | (glTF) The BIN chunk plus any base64 or BIN file buffers |

Buffers can be objects in the shape of `{buffer, byteOffset, byteLength}`.

## Helper Classes[​](#helper-classes "Direct link to Helper Classes")

To simplify higher-level processing of the loaded, raw glTF data, several helper classes are provided in the `@loaders.gl/scene/gltf` module, these can:

* unpack and remove certain glTF extensions
* extract typed array views from the JSON objects into the binary buffers
* create HTML images from image buffers
* etc

## OpenUSD Data Format[​](#openusd-data-format "Direct link to OpenUSD Data Format")

`USDLoader` returns a `USDStage` with root-layer metadata, a hierarchy of typed `USDPrim` objects, and the URLs of layers used during composition. See the [`USDLoader`](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md) reference for supported OpenUSD features and current limitations.
