import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Gaussian, vector, and voxel extensions

<Tiles3DDocsTabs active="concepts" />

This page records the reader-side contracts for newer 3D Tiles and glTF extensions. The loader
preserves declarations and binary references so a renderer or a specialized decoder can choose
when to allocate GPU resources. It does not add styling, picking, splat sorting, triangulation,
voxel ray marching, or native IFC/STEP/DWG parsing.

## Gaussian splats

[`@loaders.gl/splats`](../../splats/README) accepts standalone SPZ v2, v3, and v4 files and keeps
the existing Arrow-table output. v2 and v3 are legacy gzip streams; v4 is the current TLV/zstd
container. Coordinate conversion is explicit through `sourceCoordinateSystem` and
`targetCoordinateSystem`; no silent conversion is applied.

The glTF [`KHR_gaussian_splatting`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_gaussian_splatting)
extension is validated per primitive. POINTS mode, kernel, color space, required attributes, SH
degree continuity, non-negative scales, and opacity declarations are checked. Multiple nodes and
primitives are enumerated without assuming the first primitive is splat data. Node transforms and
raw extension JSON remain untouched.

The draft `KHR_gaussian_splatting_compression_spz_2` path preserves its buffer view and compressed
bytes. Applications may inject a decoder; embedded payloads are passed with an explicit LUF source
coordinate hint, unlike standalone SPZ compatibility defaults. Without a decoder, the compressed
descriptor is still inspectable.

## Vector and CAD topology

`3DTILES_content_gltf_vector` content can expose `EXT_mesh_polygon` and the currently agreed
primitive-restart declaration (plus the earlier alias for input compatibility). Accessor references,
polygon loop/offset declarations, and restart groups are validated. Loop indices, holes, edge
visibility, feature IDs, and structural metadata stay in their source representation: loaders.gl
does not triangulate or apply material/styling policy. These extensions track the Cesium/3D Tiles
technology-preview work and should be treated as experimental until the upstream names stabilize.

## Voxels

`EXT_primitive_voxels` descriptors preserve shape references, positive dimensions, channel/accessor
declarations, padding, no-data values, and metadata links. `3DTILES_content_voxels` is classified as
metadata-first support. Descriptors are lazy and do not allocate a dense volume. Full sample
decoding, GPU textures, ray marching, styling, and picking remain future work while the 3D Tiles 2.0
proposal evolves.

## Support stages

| Stage | Meaning |
| --- | --- |
| Reader support | JSON and binary references are validated and exposed through public descriptors. |
| Decoder support | An optional codec converts preserved bytes into normalized attributes. |
| Renderer support | A separate consumer uploads, sorts, styles, culls, or draws the data. |

See the [3D Tiles compatibility matrix](../formats/3d-tiles), [screen-space error and LOD guide](./screen-space-error-and-lod),
[`Tiles3DLoader`](../api-reference/tiles-3d-loader), and [`SPZLoader`](../../splats/api-reference/spz-loader).
