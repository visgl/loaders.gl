# Category: Scenegraph

A glTF scenegraph is described by a parsed JSON object (with top level arrays for `scenes`, `nodes` etc) together with a list of `ArrayBuffer`s representing binary blocks into which `bufferViews` and `images` in the JSON point).

At their core glTF and GLB loaders extract this information, however additional classes are provided to make processing of the returned data easier.

While the scenegraph "category" is obviously quite specific glTF, loaders for other scenegraph formats (e.g. COLLADA) could potentially also choose to "convert" the loaded data to this glTF format and thus enable interoperabiity with applications that are already designed to use the `GLTFLoader`.

## Data Structure

A JSON object with the following top-level fields:

| Field     | Type          | Default   | Description |
| ---       | ---           | ---       | --- |
| `magic`   | `Number`      | glTF      | The first four bytes of the file |
| `version` | `Number`      | `2`       | The version number |
| `json`    | `Object`      | `{}`      | The JSON chunk  |
| `buffers` | `ArrayBuffer[]` | `[]`      | (glTF) The BIN chunk plus any base64 or BIN file buffers |

Buffers can be objects in the shape of `{buffer, byteOffset, byteLength}`.

## Loaders

- [Tile3DLoader](/docs/api-reference/3d-tiles/tile-3d-loader)
- [GLBLoader](/docs/api-reference/gltf/glb-loader)
- [GLTFLoader](/docs/api-reference/gltf/gltf-loader)

