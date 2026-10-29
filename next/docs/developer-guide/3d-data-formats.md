3D data formats

# From scene files to streamed worlds.

Load scene graphs, tiled worlds, point clouds, and their compressed payloads through TypeScript implementations with detailed format coverage.

glTF3D TilesI3SCOPC

sceneglTFGLBUSD

world3D TilesI3S

pointsCOPCPotreeLAS

payloadDracomeshoptKTX2

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

3D data, by layer

## Use the format that matches the delivery problem.

A scene description, a streamed world, a point-cloud index, and a GPU texture are related, but they are not interchangeable. loaders.gl handles each layer while keeping the application-facing data model explicit.

01

Scene assets

glTF, GLB, and OpenUSD scenegraph data

02

Large worlds

3D Tiles and I3S hierarchies with level-of-detail traversal

03

Point clouds

COPC, Potree, LAS/LAZ, PLY, and PCD data

04

Runtime payloads

Draco, meshopt, Basis Universal, and KTX2 compression

## Start here[​](#start-here "Direct link to Start here")

3D applications usually combine several formats. A glTF asset may contain Draco geometry and KTX2 textures. A 3D Tiles or I3S world may deliver glTF content in a spatial hierarchy. A COPC or Potree source may deliver point records only for the nodes that matter to the current view.

The format pages below describe those boundaries in detail. Start with the delivery layer your application owns, then follow the links to the payload and runtime formats it contains.

| Layer                | Formats                                                                                                                                                                                                                                                                     | loaders.gl entry points                                                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scene descriptions   | [glTF 2.0 and selected draft 2.1 features](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md), [GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md), [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | [`GLTFLoader`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md), [`GLBLoader`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/glb-loader.md), [`USDLoader`](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md)                                                |
| Tiled worlds         | [3D Tiles 1.0/1.1](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md), [I3S 1.7/1.8 and Point Cloud 2.x](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                                                               | [`Tiles3DLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md), [`I3SLoader`](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md), [`I3SSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/i3s-source.md)                                 |
| Point-cloud delivery | [COPC 1.0](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md), [Potree 1.4–1.8](https://loaders.gl/next/docs/modules/tiles-3d/potree.md), [LAS/LAZ](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)                    | [`COPCSourceLoader`](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md), [`PotreeSourceLoader`](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md), [`LASLoader`](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)  |
| Geometry compression | [Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md), [meshopt compression](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#meshopt-compression)                                                                                  | [`DracoLoader`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md), [`DracoWriter`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md), glTF extension processing                                                                                                                         |
| Texture delivery     | [Basis Universal](https://loaders.gl/next/docs/modules/textures/formats/basis.md), [KTX/KTX2](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)                                                                                                       | [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md), [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md), [`KTX2BasisWriter`](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md) |

## What the loaders preserve[​](#what-the-loaders-preserve "Direct link to What the loaders preserve")

The 3D loaders are standards-shaped by default. They preserve source metadata and extension data where possible, while optional post-processing can resolve external assets, decompress geometry, negotiate textures, or adapt data into the shape a renderer needs.

* **Scenegraph data** retains nodes, meshes, materials, animations, extensions, and application data.
* **Tile data** retains bounding volumes, geometric error, refinement, implicit-tiling metadata, and the relationship between a tile and its content.
* **Point-cloud data** can be returned as meshes, typed point-list data, or Mesh Arrow tables with selected fields and explicit coordinate metadata.
* **Texture data** exposes mip levels, array or cube layouts, GPU-oriented formats, and the source metadata needed for runtime selection.

Workers are available for the expensive decoders, and source APIs can combine range requests, caching, cancellation, and level-of-detail selection. Those are runtime choices; the format implementations remain independently usable in Node.js and in the browser.

Detailed guide

## Format-by-format coverage

The pages below contain the compatibility matrices, extension notes, writer boundaries, and implementation details for each part of the 3D stack.

## Scene formats[​](#scene-formats "Direct link to Scene formats")

### glTF and GLB[​](#gltf-and-glb "Direct link to glTF and GLB")

The glTF implementation covers the core 2.0 scene model and selected draft 2.1 features such as unified file references, external assets, and culling shapes. It also processes Draco, meshopt, and KTX2/Basis extensions, with the standards-shaped source document available when applications need to make their own decisions.

Read the [glTF format coverage](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md) and the [`GLTFLoader` API](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md).

### OpenUSD[​](#openusd "Direct link to OpenUSD")

OpenUSD is available as a scene loader for applications that need a USD-shaped interchange entry point. See the [OpenUSD format page](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) and [`USDLoader`](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md).

## Tiled worlds[​](#tiled-worlds "Direct link to Tiled worlds")

3D Tiles and I3S describe spatial hierarchies rather than a single mesh. Their source and traversal APIs handle visibility, geometric error, refinement, linked content, and progressive requests while leaving final rendering to the application or visualization framework.

* [3D Tiles compatibility](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)
* [I3S compatibility](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)
* [3D Tiles loader](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)
* [I3S loader and profiles](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)

## Point clouds[​](#point-clouds "Direct link to Point clouds")

COPC combines LAS 1.4 point records with an octree and byte-range layout. Potree uses a related hierarchical delivery model with several 1.x metadata and node layouts. LAS/LAZ remains the standards-focused sequential format underneath many point-cloud workflows.

* [COPC compatibility and scan behavior](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)
* [Potree compatibility and source behavior](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)
* [LAS/LAZ compatibility](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)
* [Mesh and point-cloud data shapes](https://loaders.gl/next/docs/specifications/category-mesh.md)

## Compression and textures[​](#compression-and-textures "Direct link to Compression and textures")

Draco and meshopt compress geometry. Basis Universal and KTX2 compress or package texture payloads for runtime transcoding and GPU upload. They are often embedded inside glTF, 3D Tiles, and I3S delivery paths, so their compatibility pages are part of the 3D story rather than unrelated utility documentation.

* [Draco format and writer boundaries](https://loaders.gl/next/docs/modules/draco/formats/draco.md)
* [Meshopt support in glTF](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#meshopt-compression)
* [Basis Universal](https://loaders.gl/next/docs/modules/textures/formats/basis.md)
* [KTX/KTX2](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)
