# GLB - glTF Binary Format

- _[`@loaders.gl/gltf`](/docs/modules/gltf)_
- _[GLB specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/GlTF#GLB)_

A GLB file (.glb), which stands for “GL Transmission Format Binary file”. contains a binary representation of a glTF scenegraph packaged into a single binary file.

The GLB file format is a binary form of glTF that includes textures instead of referencing them as external images.

## Version History

GLB was introduced as an extension to glTF 1.0

GLB was incorporated directly into glTF 2.0.

GLB version 3 is being developed for glTF 2.1. In addition to 64-bit file and chunk lengths,
the draft format permits multiple BIN chunks and allows the glTF JSON chunk to follow custom
chunks. The first JSON chunk contains the glTF document.

## GLB Version 3 Buffer Chunks

In draft glTF 2.1 JSON, a buffer may use `chunk` instead of `uri` to select a BIN chunk in a
GLB v3 container:

```json
{
  "buffers": [
    {"byteLength": 1024, "chunk": 2},
    {"byteLength": 2048, "chunk": 4}
  ]
}
```

Chunk indices are zero-based positions in the complete GLB chunk sequence. JSON, BIN, and custom
chunks all count toward the index, so `chunk: 2` refers to the third chunk in the file. The target
must be a BIN chunk, and a buffer cannot define both `uri` and `chunk`.

For compatibility, a GLB v3 document may omit `chunk` for buffer 0 only when it uses the classic
layout: the JSON chunk is chunk 0, the BIN chunk is chunk 1, and buffer 0 is the only buffer without
a `uri`. GLB versions 1 and 2 retain their existing implicit buffer behavior.

This support follows the Khronos [Multiple Binary Chunks in GLB draft](https://github.com/KhronosGroup/glTF/issues/2611)
and may evolve while glTF 2.1 is finalized.

## Writing GLB v3

`GLBWriter` continues to emit GLB v2 by default. Pass `glb: {version: 3}` to opt into the draft
v3 container. The input can provide multiple `binChunks` and optional generic `chunks`; each
buffer's `chunk` index in the JSON remains the application's responsibility and is preserved
unchanged.

```typescript
import {GLBWriter} from '@loaders.gl/gltf';

const encoded = GLBWriter.encodeSync(glb, {glb: {version: 3}});
```

The v3 writer emits 64-bit lengths and currently supports the defined zero chunk encoding only.
It rejects unsupported encodings and lengths outside JavaScript's safe integer range.
