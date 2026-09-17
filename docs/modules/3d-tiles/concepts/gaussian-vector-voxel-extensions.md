---
title: Gaussian, vector, and voxel extensions
description: Understand reader, decoder, and renderer boundaries for Gaussian splats, vector topology, and voxel primitives.
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Gaussian, vector, and voxel extensions

<Tiles3DDocsTabs active="runtime" />

This page records the reader-side contracts for newer 3D Tiles and glTF extensions. The loader
preserves declarations and binary references so a renderer or a specialized decoder can choose
when to allocate GPU resources. It does not add styling, picking, splat sorting, triangulation,
voxel ray marching, or native IFC/STEP/DWG parsing.

## Standalone SPZ

[`@loaders.gl/splats`](/docs/modules/splats) accepts standalone SPZ v2, v3, and v4 files and keeps
the existing Arrow-table output. v2 and v3 are legacy gzip streams; v4 is the current TLV/zstd
container. Coordinate conversion is explicit through `sourceCoordinateSystem` and
`targetCoordinateSystem`; no silent conversion is applied.

These options live under `splats`. The compatibility default is source `RUB` (right/up/back), with
the target equal to the source. Explicit `RUB`/`LUF` (left/up/forward) options request a conversion.
`parseSPZToGaussianSplats` from `@loaders.gl/splats` provides the reusable decoded representation.

| Version | Container | Rotation encoding |
| --- | --- | --- |
| v2 | Gzip stream containing a 16-byte header | 8-bit quaternion components |
| v3 | Gzip stream containing a 16-byte header | Smallest-three 10-bit quaternion encoding |
| v4 | 32-byte header, TLV extensions, zstd streams | Packed smallest-three quaternion encoding |

```typescript
import {load} from '@loaders.gl/core';
import {SPZLoader} from '@loaders.gl/splats';

const table = await load('scene.spz', SPZLoader, {
  splats: {sourceCoordinateSystem: 'RUB', targetCoordinateSystem: 'LUF'}
});
```

Standalone SPZ decoding does not make a bare `.spz` URL a supported `Tiles3DLoader` tile payload.

## Gaussian glTF primitives

The glTF [`KHR_gaussian_splatting`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_gaussian_splatting)
plugin visits every mesh primitive, including splats mixed with ordinary meshes. It checks POINTS
mode, nonempty kernel/color-space declarations, required uncompressed attributes, accessor indexes,
and spherical-harmonic degree continuity. Scale and opacity range checks run when the corresponding
accessor buffers are loaded. These are not exhaustive checks of every extension constraint or kernel.

The pure `getGaussianSplatPrimitives(gltf)` helper from `@loaders.gl/gltf` extracts descriptors without
mutating or validating input; plugin parsing performs validation separately. Each descriptor contains
`meshIndex`, `primitiveIndex`, attribute references, and raw `extension` JSON.

Descriptors enumerate mesh primitives, **not node instances**. Node transforms remain in the glTF
scene graph. Consumers must resolve nodes referencing each mesh, including repeated instances;
transforms are not baked into arrays or copied into primitive descriptors.

### Optional SPZ2 decoder bridge

The draft `KHR_gaussian_splatting_compression_spz_2` path preserves its buffer view and compressed
bytes. Applications may inject a decoder; embedded payloads are passed with an explicit LUF source
coordinate hint, unlike standalone SPZ compatibility defaults. Without a decoder, the compressed
descriptor is still inspectable.

The plugin retains `compressedBufferView` and, when buffers are loaded, a copied `compressedBytes`
array. The glTF package does not depend on the splats codec. Applications can supply this adapter:

```typescript
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {parseSPZToGaussianSplats} from '@loaders.gl/splats';

const gltf = await load('scene.glb', GLTFLoader, {
  gltf: {
    loadBuffers: true,
    splatDecoder: (data, {sourceCoordinateSystem}) =>
      parseSPZToGaussianSplats(data, {
        splats: {sourceCoordinateSystem, targetCoordinateSystem: 'LUF'}
      })
  }
});
```

The callback result is retained as `descriptor.decoded`. The bridge does not convert that result
into glTF accessors or reconcile decoded point counts with accessor counts. Consumers must check
those associations and perform required attribute conversions. Do not let standalone SPZ defaults
override the embedded LUF coordinate contract.

## 3D Tiles integration

With `'3d-tiles': {loadGLTF: true}`, parsed glTF tile payloads expose `gaussianSplatPrimitives` and
`voxelPrimitives`. Access these through the appropriate `tile.contentEntries[index].payload`, not
only `tile.content`: a tile may contain several payloads and a payload several mesh/splat primitives.
Retain mesh/primitive indexes when associating descriptors with feature IDs and structural metadata.

See [renderer contracts and metadata](./renderer-contracts-and-metadata) for ordering and lifecycle.
A loaded descriptor does not mean that GPU resources exist.

## Vector and CAD topology

The experimental vector path recognizes `3DTILES_content_gltf_vector`, `EXT_mesh_polygon`, and
`KHR_mesh_primitive_restart`. Supported encodings produce point, polyline, and polygon descriptors,
including restart-separated groups and polygon topology. Source declarations retain feature-ID and
structural-metadata associations. This is a reader for tiled vector geometry, not a native CAD parser
or a triangulation/styling engine. See the [pinned experimental profile](./3d-tiles-2-0-experimental)
for draft names, vector-content access, and spatial behavior.

## Voxels

`getVoxelPrimitives(gltf)` from `@loaders.gl/gltf` extracts mesh/primitive descriptors with attribute
references and raw `EXT_primitive_voxels` JSON. Plugin validation checks a non-negative integer shape
reference, three positive integer dimensions, the supported primitive-mode declaration, and accessor
indexes. It does not resolve the referenced shape or decode a dense sample volume.

Padding, no-data declarations, quantization, and metadata links remain raw fields where authored;
preserving them does not apply their semantics. `3DTILES_content_voxels` is recognized in the 1.x
required-extension list, but this does not enable the complete required draft 2.0 voxel tileset
profile. Dense decoding, GPU textures, ray marching, styling, and picking remain future work.

## Support stages

| Stage | Meaning |
| --- | --- |
| Reader support | JSON and binary references are validated and exposed through public descriptors. |
| Decoder support | An optional codec converts preserved bytes into normalized attributes. |
| Renderer support | A separate consumer uploads, sorts, styles, culls, or draws the data. |

See the [3D Tiles compatibility matrix](../formats/3d-tiles), [screen-space error and LOD guide](./screen-space-error-and-lod),
[`Tiles3DLoader`](../api-reference/tiles-3d-loader), and [`SPZLoader`](../../splats/api-reference/spz-loader).
