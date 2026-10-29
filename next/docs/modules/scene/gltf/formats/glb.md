Binary scene container

![](/next/images/format-logos/gltf-logo.svg)GLB

# Put a complete glTF scene in one file.

GLB packages the glTF JSON document, binary buffers, and embedded resources into a single binary container. It is the compact delivery form for portable 3D scenes.

[glTF module](https://loaders.gl/next/docs/modules/scene/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

A layered 3D format stack

## Choose the delivery layer. Keep the data path.

A scene file, a tiled world, and a compressed payload solve different problems. loaders.gl keeps those boundaries visible while providing the readers needed to move between them.

Scene descriptions

Hierarchy, materials, transforms, and animation

[glTF 2.0 + draft 2.1↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLB↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[OpenUSD↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

Tiled worlds and point clouds

Spatial hierarchy, level of detail, and selective delivery

[3D Tiles 1.0 / 1.1↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[I3S 1.7 / 1.8 + PC 2.x↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[COPC 1.0 · Potree 1.x↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

Geometry and texture payloads

Compression and GPU-ready delivery underneath the formats

[Draco↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Meshopt compression↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#meshopt-compression)[Basis Universal / KTX2↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

Application-facing results

scenegraphtile contentMesh / point-listTextureLevel

The GLB boundary

## Scene structure stays glTF. Delivery becomes one binary.

Applications can use the same scenegraph model whether buffers and images are external in .gltf or packaged into the chunks of a .glb file.

01

JSON

Scene, nodes, meshes, materials, and metadata

02

BIN

Buffer data referenced by accessors

03

Resources

Textures and other embedded chunks

04

Next generation

Draft GLB v3 multiple binary chunks

* *[`@loaders.gl/scene/gltf`](https://loaders.gl/next/docs/modules/scene/gltf.md)*
* *[GLB specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification)*
* *[Wikipedia article](https://en.wikipedia.org/wiki/GlTF#GLB)*

A GLB file (.glb), which stands for “GL Transmission Format Binary file”. contains a binary representation of a glTF scenegraph packaged into a single binary file.

The GLB file format is a binary form of glTF that includes textures instead of referencing them as external images.

Detailed guide

## GLB structure and version history

The sections below cover the container layout, GLB versions, multiple binary chunks, and writing behavior.

## Version History[​](#version-history "Direct link to Version History")

GLB was introduced as an extension to glTF 1.0

GLB was incorporated directly into glTF 2.0.

GLB version 3 is being developed for glTF 2.1. In addition to 64-bit file and chunk lengths, the draft format permits multiple BIN chunks and allows the glTF JSON chunk to follow custom chunks. The first JSON chunk contains the glTF document.

## GLB 3 Support[​](#glb-3-support "Direct link to GLB 3 Support")

Draft GLB 3 support follows the evolving glTF 2.1 specification. **✅ Supported** means the stated container behavior is implemented; **⚠️ Partial** identifies a supported subset; **❌ Unsupported** means the behavior is not provided. Scene-feature support is described separately in the [glTF support table](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#loadersgl-gltf-feature-coverage).

| Capability                               | Reading | Writing | Limits                                                                                                                                                                      |
| ---------------------------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 64-bit file and chunk lengths            | ✅      | ✅      | Lengths must be JavaScript safe integers and fit available memory.                                                                                                          |
| Multiple BIN chunks                      | ✅      | ✅      | Preserves the binary chunks; glTF buffers select them by chunk index.                                                                                                       |
| Explicit `buffer.chunk` references       | ✅      | ✅      | Resolves BIN references and rejects conflicting `uri` fields. The writer preserves supplied indices; applications must keep them consistent with chunk order.               |
| JSON following custom chunks             | ✅      | ✕       | The loader uses the first JSON chunk. The writer always emits its JSON chunk first.                                                                                         |
| Custom chunk payloads                    | ✕       | ✅      | The parser skips unknown payloads while counting their chunk positions. The writer accepts supplied generic `chunks`; unknown payloads are not automatically round-tripped. |
| Classic implicit buffer 0                | ⚠️      | ✅      | Reading requires JSON at chunk 0, BIN at chunk 1, and exactly one URI-less buffer.                                                                                          |
| Zero chunk encoding                      | ✅      | ✅      | The currently defined encoding is accepted.                                                                                                                                 |
| Nonzero chunk encodings                  | ✕       | ✕       | Rejected rather than silently interpreted.                                                                                                                                  |
| Lengths beyond `Number.MAX_SAFE_INTEGER` | ✕       | ✕       | Rejected to avoid precision loss.                                                                                                                                           |

## GLB Version 3 Buffer Chunks[​](#glb-version-3-buffer-chunks "Direct link to GLB Version 3 Buffer Chunks")

In draft glTF 2.1 JSON, a buffer may use `chunk` instead of `uri` to select a BIN chunk in a GLB v3 container:

```
{

  "buffers": [

    {"byteLength": 1024, "chunk": 2},

    {"byteLength": 2048, "chunk": 4}

  ]

}
```

Chunk indices are zero-based positions in the complete GLB chunk sequence. JSON, BIN, and custom chunks all count toward the index, so `chunk: 2` refers to the third chunk in the file. The target must be a BIN chunk, and a buffer cannot define both `uri` and `chunk`.

For compatibility, a GLB v3 document may omit `chunk` for buffer 0 only when it uses the classic layout: the JSON chunk is chunk 0, the BIN chunk is chunk 1, and buffer 0 is the only buffer without a `uri`. GLB versions 1 and 2 retain their existing implicit buffer behavior.

This support follows the Khronos [Multiple Binary Chunks in GLB draft](https://github.com/KhronosGroup/glTF/issues/2611) and may evolve while glTF 2.1 is finalized.

## Writing GLB v3[​](#writing-glb-v3 "Direct link to Writing GLB v3")

`GLBWriter` continues to emit GLB v2 by default. Pass `glb: {version: 3}` to opt into the draft v3 container. The input can provide multiple `binChunks` and optional generic `chunks`; each buffer's `chunk` index in the JSON remains the application's responsibility and is preserved unchanged.

```
import {GLBWriter} from '@loaders.gl/scene/gltf';



const encoded = GLBWriter.encodeSync(glb, {glb: {version: 3}});
```

The v3 writer emits 64-bit lengths and currently supports the defined zero chunk encoding only. It rejects unsupported encodings and lengths outside JavaScript's safe integer range.
