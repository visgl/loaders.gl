glTF writer

![](/next/images/format-logos/gltf-logo.svg)

# Write a glTF scenegraph as a binary GLB.

`GLTFWriter` encodes glTF JSON and loaded buffers as a binary GLB, with optional asynchronous Draco compression.

[glTF module](https://loaders.gl/next/docs/modules/scene/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf.md)[glTF format](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[Scenegraph category](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

The scenegraph writing path

## Build a portable scene file from common scene data.

The writer takes the loaders.gl scenegraph representation and assembles the JSON, buffers, images, and optional compression extensions required by the target glTF container.

01

Input

Loaders.gl scenegraph data

02

Assembly

Nodes, meshes, materials, buffers, and images

03

Compression

Optional asynchronous Draco compression

04

Output

\`.glb\` binary

Detailed guide

## Writer options and output details

The reference below covers usage, output formats, optional Draco integrations, synchronous encoding, and scenegraph requirements.

The `GLTFWriter` is a writer for glTF scenegraphs.

| GLTFWriter      |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                |
| File Types      | Binary                                                                                |
| Data Format     | [Scenegraph](https://loaders.gl/next/docs/specifications/category-scenegraph.md) |
| File Format     | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0)            |
| Supported APIs  | `encode`, `encodeSync`                                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {GLTFWriter} from '@loaders.gl/scene/gltf';

import {encodeSync} from '@loaders.gl/core';



const arrayBuffer = encodeSync(gltf, GLTFWriter, options);
```

Materials annotated by the loader with `unlit: true` are written as required `KHR_materials_unlit` extensions. Existing raw optional unlit extensions remain optional. The writer omits empty extension declarations and does not invent a binary buffer or BIN chunk for assets without binary data. These repairs do not establish full glTF conformance.

## Options[​](#options "Direct link to Options")

| Option                                 | Type      | Default | Description                                                             |
| -------------------------------------- | --------- | ------- | ----------------------------------------------------------------------- |
| `gltf.draco.enabled`                   | `boolean` | `false` | Generate `KHR_draco_mesh_compression` payloads with async `encode`.     |
| `gltf.draco.skipUnsupportedPrimitives` | `boolean` | `true`  | Leave non-triangle primitives unchanged; set to `false` to reject them. |
| `byteOffset`                           | `number`  | `0`     | Byte offset passed to binary container encoding.                        |

Additional Draco build settings are accepted under `gltf.draco`. Input data is not modified. Compression currently requires at most one loaded buffer; original accessors remain available for consumers that do not decode the extension. `encodeSync` throws when Draco compression is enabled. JSON `.gltf` files and separate-asset output are not supported by this writer.
