import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# GLTFLoader

<GltfDocsTabs active="gltf-loader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

Parses a glTF file. Can load both the `.glb` (binary) and `.gltf` (application/json) file format variants.

A glTF file contains a hierarchical scenegraph description that can be used to instantiate corresponding hierarcy of actual `Scenegraph` related classes in most WebGL libraries.

| Loader          | Characteristic                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| File Extensions | `.glb`, `.gltf`                                                                                                                                                 |
| File Type       | Binary, JSON, Linked Assets                                                                                                                                     |
| File Format     | [glTF v2.1 (draft)](/docs/modules/gltf/formats/gltf#gltf-21-draft), [glTF v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0), [GLTF v1](https://github.com/KhronosGroup/glTF/tree/master/specification/1.0) \* |
| Data Format     | [Scenegraph](/docs/specifications/category-scenegraph)                                                                                                          |
| Supported APIs  | `load`, `parse`                                                                                                                                                 |
| Subloaders      | `DracoLoader`, `ImageBitmapLoader`                                                                                                                              |     |

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

Draft glTF 2.1 readiness includes the [new accessor component type definitions](/docs/modules/gltf/formats/gltf#accessor-component-types). `GLTFScenegraph` and `postProcessGLTF` expose these values through the corresponding JavaScript typed arrays.

The loader also supports draft glTF 2.1 [thumbnails](/docs/modules/gltf/formats/gltf#draft-gltf-21-thumbnails). When `asset.thumbnail` references an image, `gltf.loadImages: true` loads that image even if it is not used by a texture.

The GLTF Loader returns an object with a `json` field containing the glTF Scenegraph. In its basic mode, the `GLTFLoader` does not modify the loaded JSON in any way. Instead, the results of additional processing are placed in parallel top-level fields such as `buffers` and `images`. This ensures that applications that want to work with the standard glTF data structure can do so.

Optionally, the loaded gltf can be "post processed", which lightly annotates and transforms the loaded JSON structure to make it easier to use. Refer to [postProcessGLTF](post-process-gltf) for details.

In addition, certain glTF extensions, including Draco and [meshopt compression](/docs/modules/gltf/formats/gltf#meshopt-compression), can be fully or partially processed during loading. When possible (and extension processing is enabled), such extensions will be resolved/decompressed and replaced with standards conformant representations.

Note: while supported, synchronous parsing of glTF (e.g. using `parseSync()`) has significant limitations. When parsed asynchronously (using `await parse()` or `await load()`), the following additional capabilities are enabled:

- linked binary resource URI:s will be loaded and resolved (assuming a valid base url is available).
- base64 encoded binary URI:s inside the JSON payload will be decoded.
- linked image URI:s can be loaded and decoded.
- linked raster image URI:s are decoded through [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader), producing `ImageBitmap` in browsers and the Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is installed.
- Draco meshes can be decoded asynchronously on worker threads (in parallel!).

## Options

| Option                    | Type    | Default | Description                                                                  |
| ------------------------- | ------- | ------- | ---------------------------------------------------------------------------- |
| `gltf.loadBuffers`        | Boolean | `false` | Fetch any referenced binary buffer files (and decode base64 encoded URIS).   |
| `gltf.loadFiles`          | Boolean | `false` | Resolve draft glTF 2.1 `files` entries from URIs or buffer views.             |
| `gltf.loadExternalAssets` | Boolean | `false` | Recursively parse draft glTF 2.1 external assets instantiated by scene nodes. |
| `gltf.loadImages`         | Boolean | `false` | Load images referenced by textures or the draft glTF 2.1 thumbnail.          |
| `gltf.decompressMeshes`   | Boolean | `true`  | Decompress Draco and [KHR/EXT meshopt](/docs/modules/gltf/formats/gltf#meshopt-compression) data. |
| `gltf.normalize`          | Boolean | `false` | Optional, best-effort attempt at converting glTF v1 files to glTF2 format.   |

### Meshopt decompression

`GLTFLoader` supports both the existing `EXT_meshopt_compression` extension and the newer
`KHR_meshopt_compression` extension. KHR adds version 1 attribute streams and the `COLOR` filter;
support for KHR does not replace EXT because glTF capability negotiation uses the exact extension
name and existing assets continue to declare EXT.

Meshopt decoding is available during asynchronous parsing when `gltf.loadBuffers` and
`gltf.decompressMeshes` are both enabled. The maintained decoder ships with `@loaders.gl/gltf`, so
there is no decoder option or application-level initialization step. Successful decoding writes
the uncompressed bytes into the buffer range described by the parent buffer view and removes the
processed extension declarations. The compressed source buffer remains in the returned data.

Set `gltf.decompressMeshes` to `false` to retain both KHR and EXT declarations for another component
to process. See [Meshopt compression](/docs/modules/gltf/formats/gltf#meshopt-compression) for the
stream versions, modes, filters, fallback-buffer behavior, and comparison with Draco.

## Draft glTF 2.1 File Resolution

`resolveGLTFFile(gltf, fileReference, options, context)` resolves one entry from the draft glTF 2.1
`files` array. `fileReference` can be an array index, a package name matching `files[*].name`, or an
original URI matching `files[*].uri`. URI-backed files are fetched relative to the containing asset;
buffer-view-backed files return a view of the already loaded buffer without copying it. Resolved
entries are cached in the parallel `gltf.files` array.

`findGLTFFileIndex(gltf, reference)` performs only the virtual package lookup and returns `-1` when
there is no matching entry. Ambiguous package names are rejected.

## Draft glTF 2.1 External Assets

With `gltf.loadExternalAssets: true`, `GLTFLoader` parses external assets referenced by
`json.nodes[*].externalAsset`. Parsed children are stored in `gltf.externalAssets` at the same index
as their `json.externalAssets` definition. Repeated references to the same URI share one parsed
result, and cyclical references are rejected.

Dependencies of URI-backed children resolve relative to the child URI. Dependencies of embedded
children resolve through the containing asset's `files` array, allowing an unmodified nested glTF
and its buffers or textures to be packaged together. Unreferenced definitions remain unloaded.

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

```typescripton
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

```typescripton
{
  // The base URI used to load this glTF, if any. For resolving relative uris to linked resources.
  baseUri: String,

  // JSON Chunk
  json: Object, // Contains the unmodified parsed glTF JSON (the parsed GLB JSON chunk)

  // Length and indices of this array will match `json.buffers`
  // GLB v1/v2's bin chunk, or GLB v3 chunks selected by json.buffers[*].chunk.
  // Additional glTF json `buffers` are fetched and base64 decoded from the JSON uri:s.
  buffers: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number
  }],

  // Draft glTF 2.1 generic files. Length and indices match json.files.
  files: [{
    arrayBuffer: ArrayBuffer,
    byteOffset: Number,
    byteLength: Number,
    mimeType: String,
    name: String, // optional virtual package name
    url: String  // optional resolved URL
  }],

  // Recursively parsed glTF 2.1 assets. Indices match json.externalAssets.
  // Unreferenced definitions remain null.
  externalAssets: Array<GLTFWithBuffers | null>,

  // Images can optionally be loaded and decoded, they will be stored here.
  // Standard raster images are decoded through ImageBitmapLoader.
  // Length and indices of this array will match `json.buffers`
  images: Array<ImageBitmap | object>,

  // GLBLoader output, if this was a GLB encoded glTF
  _glb?: Object
}
```

For draft GLB v3 files, `GLTFLoader` resolves each `json.buffers[*].chunk` index to the
corresponding BIN chunk. See the [GLB format documentation](../formats/glb) for indexing and
legacy fallback rules.

| Field                     | Type          | Default | Description                                                      |
| ------------------------- | ------------- | ------- | ---------------------------------------------------------------- |
| `baseUri`                 | `String`      | ``      | length of GLB (e.g. embedded in larger binary block)             |
| `json`                    | `Object`      | `{}`    | Parsed JSON from the JSON chunk                                  |
| `buffers`                 | `Object[]`    | `[]`    | The version number                                               |
| `buffers[\*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk                                                 |
| `buffers[\*].byteOffset`  | `Number`      | `null`  | offset of buffer (embedded in larger binary block)               |
| `buffers[\*].byteLength`  | `ArrayBuffer` | `null`  | length of buffer (embedded in larger binary block)               |
| `_glb`?                   | `Object`      | N/A     | The output of the GLBLoader if the parsed file was GLB formatted |
