Hierarchical scene format

# Compose a scene without flattening it first.

OpenUSD describes scenes as composed layers and prims. The initial loaders.gl implementation reads a useful, explicit subset so applications can inspect the stage and retain source relationships.

[Scene module](https://loaders.gl/next/docs/modules/scene.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene.md)[Scenegraph category](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)

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

Composition is the format

## Keep layers, payloads, and authored values visible.

OpenUSD is useful when the relationships between scene elements matter. loaders.gl exposes those relationships in a typed stage representation rather than reducing the file to a flat mesh.

01

Reads

ASCII USDA/USD layers and uncompressed USDZ

02

Preserves

Prim hierarchy, references, payloads, variants, and overrides

03

Output

Typed stage and prim data for application-specific use

04

Boundary

Binary USDC, compressed ZIP entries, and full composition remain future work

[OpenUSD](https://openusd.org/release/index.html) describes hierarchical 3D scenes in text and binary layer formats. The initial loaders.gl implementation supports:

Detailed guide

## OpenUSD support details

The sections below list the supported layers and the explicit boundaries of the current implementation.

* ASCII `.usda` layers and ASCII content stored with a `.usd` extension
* Uncompressed `.usdz` ZIP archives whose root layer is ASCII
* External and packaged references, payloads, authored variants, and local overrides

Binary USDC crate layers, compressed ZIP entries, and the complete OpenUSD composition semantics are not yet supported.
