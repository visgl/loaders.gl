# GLTFLoader

Parses a glTF file. Can load both the `.glb` (binary) and `.gltf` (application/json) file format variants.

A glTF file contains a hierarchical scenegraph description that can be used to instantiate corresponding hierarcy of actual `Scenegraph` related classes in most WebGL libraries.

| Loader          | Characteristic                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| File Extensions | `.glb`, `.gltf`                                                                                                                                                 |
| File Type       | Binary, JSON, Linked Assets                                                                                                                                     |
| File Format     | [glTF v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0), [GLTF v1](https://github.com/KhronosGroup/glTF/tree/master/specification/1.0) \* |
| Data Format     | [Scenegraph](/docs/specifications/category-scenegraph)                                                                                                          |
| Supported APIs  | `load`, `parse`                                                                                                                                                 |
| Subloaders      | `DracoLoader`, `ImageLoader`                                                                                                                                    |     |

\* From [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io), the `GLTFLoader` offers optional, best-effort support for converting older glTF v1 files to glTF v2 format (`options.gltf.normalize: true`). This conversion has a number of limitations and the parsed data structure may be only partially converted to glTF v2, causing issues to show up later e.g. when attempting to render the scenegraphs.

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

## Overview

The `GLTFLoader` aims to take care of as much processing as possible, while remaining framework-independent.

The GLTF Loader returns an object with a `json` field containing the glTF Scenegraph. In its basic mode, the `GLTFLoader` does not modify the loaded JSON in any way. Instead, the results of additional processing are placed in parallel top-level fields such as `buffers` and `images`. This ensures that applications that want to work with the standard glTF data structure can do so.

Optionally, the loaded gltf can be "post processed", which lightly annotates and transforms the loaded JSON structure to make it easier to use. Refer to [postProcessGLTF](post-process-gltf) for details.

In addition, certain glTF extensions, in particular Draco mesh encoding, can be fully or partially processed during loading. When possible (and extension processing is enabled), such extensions will be resolved/decompressed and replaced with standards conformant representations. See [glTF Extensions](gltf-extensions) for more information.

Note: while supported, synchronous parsing of glTF (e.g. using `parseSync()`) has significant limitations. When parsed asynchronously (using `await parse()` or `await load()`), the following additional capabilities are enabled:

- linked binary resource URI:s will be loaded and resolved (assuming a valid base url is available).
- base64 encoded binary URI:s inside the JSON payload will be decoded.
- linked image URI:s can be loaded and decoded.
- Draco meshes can be decoded asynchronously on worker threads (in parallel!).

## Options

| Option                  | Type    | Default |                                                                            | Description |
| ----------------------- | ------- | ------- | -------------------------------------------------------------------------- | ----------- |
| `gltf.loadBuffers`      | Boolean | `false` | Fetch any referenced binary buffer files (and decode base64 encoded URIS). |
| `gltf.loadImages`       | Boolean | `false` | Load any referenced image files (and decode base64 encoded URIS).          |
| `gltf.decompressMeshes` | Boolean | `true`  | Decompress Draco compressed meshes (if DracoLoader available).             |
| `gltf.normalize`        | Boolean | `false` | Optional, best-effort attempt at converting glTF v1 files to glTF2 format. |


## Working with GLTF data

The job of `GLTFLoader` is to open the glTF container file(s) and extract the glTF JSON, together with any associated binary chunks and images. 

If you already have access to libraries or code that process standard glTF JSON directly, this format may be appropriate. However, in this 'storage optimized" form, traversing the loaded glTF scene graph tends to required verbose and repetitive code with lots of checks and guards.

To simplify traversal and manipulation of glTF data, loaders.gl provides two separate mechanisms:

- The [`postProcessGLTF()`](./post-process-gltf) function converts the glTF JSON into a largely equivalent JavaScript structure that significantly simpler to work with.
- The [`GLTFScenegraph`](./gltf-scenegraph) function accepts glTF data and provides methods for accessing or modifying APIS.

The gltf module provides typescript definitions for the glTF JSON that align with the glTF specification, and all APIs and return values are strongly typed to assist applications to write robust code.

## Data Format

The data format returned by the `GLTFLoader` is the unmodified glTF JSON extracted from any binary containers, together with loaded binary chunks and optionally loaded images.

The standard glTF JSON structure will be available in the `json` field.

```json
{
  json: {
    scenes: [...],
    scene: ...,
    nodes: [...],
    ...
  }
}
```

However, the objects inside these arrays will have been pre-processed to simplify usage. For details on changes and extra fields added to the various glTF objects, see [post processing](post-process-gltf).


```json
{
  // The base URI used to load this glTF, if any. For resolving relative uris to linked resources.
  baseUri: String,

  // JSON Chunk
  json: Object, // Contains the unmodified parsed glTF JSON (the parsed GLB JSON chunk)

  // Length and indices of this array will match `json.buffers`
  // The GLB bin chunk, if present, will be found in buffer 0.
  // Additional glTF json `buffers` are fetched and base64 decoded from the JSON uri:s.
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

| Field                     | Type          | Default | Description                                                      |
| ------------------------- | ------------- | ------- | ---------------------------------------------------------------- |
| `baseUri`                 | `String`      | ``      | length of GLB (e.g. embedded in larger binary block)             |
| `json`                    | `Object`      | `{}`    | Parsed JSON from the JSON chunk                                  |
| `buffers`                 | `Object[]`    | `[]`    | The version number                                               |
| `buffers[\*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk                                                 |
| `buffers[\*].byteOffset`  | `Number`      | `null`  | offset of buffer (embedded in larger binary block)               |
| `buffers[\*].byteLength`  | `ArrayBuffer` | `null`  | length of buffer (embedded in larger binary block)               |
| `_glb`?                   | `Object`      | N/A     | The output of the GLBLoader if the parsed file was GLB formatted |

