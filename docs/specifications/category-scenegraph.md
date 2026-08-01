# Scenegraph Loaders

The Scenegraph category represents hierarchical 3D scene descriptions. Each loader returns a
typed representation close to its source format.

## Loaders

| Loader                                                       | Notes |
| ------------------------------------------------------------ | ----- |
| [`GLTFLoader`](/docs/modules/gltf/api-reference/gltf-loader) |       |
| [`GLBLoader`](/docs/modules/gltf/api-reference/glb-loader)   |       |
| [`USDLoader`](/docs/modules/scene/api-reference/usd-loader)   |       |

## glTF Data Format

The data format is fairly raw, close to the unpacked glTF/GLB data structure, it is described by:

- a parsed JSON object (with top level arrays for `scenes`, `nodes` etc)
- a list of `ArrayBuffer`s representing binary blocks (into which `bufferViews` and `images` in the JSON point).

## Data Structure

A JSON object with the following top-level fields:

| Field     | Type            | Default | Description                                              |
| --------- | --------------- | ------- | -------------------------------------------------------- |
| `magic`   | `Number`        | glTF    | The first four bytes of the file                         |
| `version` | `Number`        | `2`     | The version number                                       |
| `json`    | `Object`        | `{}`    | The JSON chunk                                           |
| `buffers` | `ArrayBuffer[]` | `[]`    | (glTF) The BIN chunk plus any base64 or BIN file buffers |

Buffers can be objects in the shape of `{buffer, byteOffset, byteLength}`.

## Helper Classes

To simplify higher-level processing of the loaded, raw glTF data, several helper classes are provided in the `@loaders.gl/gltf` module, these can:

- unpack and remove certain glTF extensions
- extract typed array views from the JSON objects into the binary buffers
- create HTML images from image buffers
- etc

## OpenUSD Data Format

`USDLoader` returns a `USDStage` with root-layer metadata, a hierarchy of typed `USDPrim` objects,
and the URLs of layers used during composition. See the
[`USDLoader`](/docs/modules/scene/api-reference/usd-loader) reference for supported OpenUSD
features and current limitations.
