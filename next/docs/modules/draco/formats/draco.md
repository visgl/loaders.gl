Compressed geometry format

![](/next/images/format-logos/draco-logo.svg)

# Ship geometry without throwing away its attributes.

Draco compresses meshes and point clouds for transport. loaders.gl exposes the decoder and writer behind the same typed geometry boundary used by glTF, 3D Tiles, I3S, and standalone workflows.

[Draco module](https://loaders.gl/next/docs/modules/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

![](/next/images/format-logos/draco-logo.svg)[Try It](https://loaders.gl/next/examples/pointclouds/draco)[Overview](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Format](https://loaders.gl/next/docs/modules/draco/format.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

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

The compressed payload

## Keep the geometry contract. Reduce the bytes.

The format preserves the logical mesh or point-cloud attributes while using quantization and compression to reduce delivery size. The remaining limits are explicit in the support matrix.

01

Input

Mesh or point-cloud attributes

02

Codec

Draco JavaScript or WebAssembly runtime

03

Output

Typed arrays and geometry metadata

04

Used by

glTF, 3D Tiles, I3S, and direct loaders

* *[`@loaders.gl/draco`](https://loaders.gl/next/docs/modules/draco.md)* - loaders.gl implementation
* *[Draco3D](https://google.github.io/draco/)* - Open-source library for compressing and decompressing 3D geometric meshes and point clouds.

Detailed guide

## Draco attributes and compatibility

The sections below cover use cases, supported geometry types, attribute data types, and the current decoder and writer boundaries.

## Use cases[​](#use-cases "Direct link to Use cases")

While possible to use independently, Draco compression is primarily used to compress geometries in glTF files and also in tiled 3D formats such as 3D Tiles and I3S.

## Supported Features[​](#supported-features "Direct link to Supported Features")

* Supports meshes and point clouds.

| Mesh Type     | Supported |
| ------------- | --------- |
| `MESH`        | ✅        |
| `POINT_CLOUD` | ✅        |

The official 1.5.7 JavaScript binding does not expose `AddInt64Attribute`, `AddUInt64Attribute`, or `AddFloat64Attribute`, and it has no corresponding typed-array classes for decoder extraction. loaders.gl therefore rejects 64-bit attributes explicitly rather than narrowing them silently. A future Draco binding that exposes those APIs can be adopted after adding matching typed output and conformance coverage.

## Draco Attribute Support[​](#draco-attribute-support "Direct link to Draco Attribute Support")

| Attribute Type    | `DracoLoader` | `DracoWriter` | JS Type        |
| ----------------- | ------------- | ------------- | -------------- |
| `DT_INT8` (1)     | ✅            | ✅            | `Int8Array`    |
| `DT_UINT8` (2)    | ✅            | ✅            | `Uint8Array`   |
| `DT_INT16` (3)    | ✅            | ✅            | `Int16Array`   |
| `DT_UINT16` (4)   | ✅            | ✅            | `Uint16Array`  |
| `DT_INT32` (5)    | ✅            | ✅            | `Int32Array`   |
| `DT_UINT32` (6)   | ✅            | ✅            | `Uint32Array`  |
| `DT_INT64` (7)    | ✕             | ✕             | `Int64Array`   |
| `DT_UINT64` (8)   | ✕             | ✕             | `Uint64Array`  |
| `DT_FLOAT32` (9)  | ✅            | ✅            | `Float32Array` |
| `DT_FLOAT64` (10) | ✕             | ✕             | `Float64Array` |
| `DT_BOOL` (11)    | ✕             | ✕             | N/A            |

Notes:

* Multiple attributes of the same Draco category are preserved. If an attribute has no explicit metadata name, the loader assigns collision-free names such as `COLOR_0`, `COLOR_1`, `TEXCOORD_0`, and `TEXCOORD_1`.
* `Float64` and other 64 bit formats are not valid for glTF geometry attributes, These are normally only used for "extra" attributes. 64 bit attributes can appear when converting LAS files with metadata to glTF or 3D Tiles, see [CesiumJS blog](https://cesium.com/blog/2024/03/20/preserving-more-metadata-for-point-clouds-using-3dtiles/)
* loaders.gl ignores unsupported attributes.

## Draco Metadata Support[​](#draco-metadata-support "Direct link to Draco Metadata Support")

* Metadata dictionaries are available both on the mesh and also on each attribute.
* Supports all Draco metadata field types, including:

| Metadata Field | Supported |
| -------------- | --------- |
| `Int32Array`   | ✅        |
