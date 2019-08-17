# Category: Scenegraph

The Scenegraph category is intended to represent glTF scenegraphs.

The data format is fairly raw, close to the unpacked glTF/GLB data structure, it is described by:
- a parsed JSON object (with top level arrays for `scenes`, `nodes` etc)
- a list of `ArrayBuffer`s representing binary blocks (into which `bufferViews` and `images` in the JSON point).

## Helper Classes

To simplify higher-level processing of the loaded, raw glTF data, several helper classes are provided in the `@loaders.gl/gltf` module, these can:
- unpack and remove certain glTF extensions
- extract typed array views from the JSON objects into the binary buffers
- create HTML images from image buffers
- etc

## Non-glTF Scenegraphs

The scenegraph "category" is quite specific glTF, and there are no plans to support other scenegraph formats in loaders.gl. Therefore, the current recommendation is to convert scenegraph files to glTF with external tools before loading them using loaders.gl.

That said, hypothetical new loaders for other scenegraph formats (e.g. a COLLADA loader) could potentially choose to belong to the Scenegraph category by "converting" the loaded data to this glTF format (and thus enable interoperability with applications that are already designed to use the `GLTFLoader`).

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

- [GLTFLoader](/docs/api-reference/gltf/gltf-loader)
- [GLBLoader](/docs/api-reference/gltf/glb-loader)

## Notes

- [Tile3DLoader](/docs/api-reference/3d-tiles/tile-3d-loader) some tiles contain embedded glTF.
