# Scenegraph Loaders

The Scenegraph category is intended to represent glTF scenegraphs.

## Loaders

| Loader                | Notes |
| --------------------- | ----- |
| [`GLTFLoader`](modules/gltf/docs/api-reference/gltf-loader) | |
| [`GLBLoader`](modules/gltf/docs/api-reference/glb-loader) | |

## Data Format

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

## Non-glTF Scenegraphs

The scenegraph "category" was created specifically for the `glTF` format, and there are no plans to support other scenegraph formats in loaders.gl (as such formats tend to have large and complex specifications with many edge cases). 

Therefore, the current recommendation is to first convert scenegraph files in other formats to glTF with external tools before loading them using loaders.gl.

That said, hypothetical new loaders for other scenegraph formats (e.g. a COLLADA loader) could potentially choose to belong to the Scenegraph category by "converting" loaded data to the format described on this page. It would thus enable interoperability with applications that are already designed to use the `GLTFLoader`).
