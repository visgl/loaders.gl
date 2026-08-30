---
title: 3D data formats
description: Load scene files, tiled worlds, point clouds, and compressed 3D payloads with standards-aware TypeScript readers.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero capability="3d" />

<ThreeDDataFormatsGraphic />

<DocOrientation
  eyebrow="3D data, by layer"
  title="Use the format that matches the delivery problem."
  description="A scene description, a streamed world, a point-cloud index, and a GPU texture are related, but they are not interchangeable. loaders.gl handles each layer while keeping the application-facing data model explicit."
  tone="blue"
  items={[
    {label: 'Scene assets', value: 'glTF, GLB, and OpenUSD scenegraph data'},
    {label: 'Large worlds', value: '3D Tiles and I3S hierarchies with level-of-detail traversal'},
    {label: 'Point clouds', value: 'COPC, Potree, LAS/LAZ, PLY, and PCD data'},
    {label: 'Runtime payloads', value: 'Draco, meshopt, Basis Universal, and KTX2 compression'}
  ]}
/>

## Start here

3D applications usually combine several formats. A glTF asset may contain Draco geometry and KTX2
textures. A 3D Tiles or I3S world may deliver glTF content in a spatial hierarchy. A COPC or Potree
source may deliver point records only for the nodes that matter to the current view.

The format pages below describe those boundaries in detail. Start with the delivery layer your
application owns, then follow the links to the payload and runtime formats it contains.

| Layer | Formats | loaders.gl entry points |
| --- | --- | --- |
| Scene descriptions | [glTF 2.0 and selected draft 2.1 features](/docs/modules/gltf/formats/gltf), [GLB](/docs/modules/gltf/formats/glb), [OpenUSD](/docs/modules/scene/formats/usd) | [`GLTFLoader`](/docs/modules/gltf/api-reference/gltf-loader), [`GLBLoader`](/docs/modules/gltf/api-reference/glb-loader), [`USDLoader`](/docs/modules/scene/api-reference/usd-loader) |
| Tiled worlds | [3D Tiles 1.0/1.1](/docs/modules/3d-tiles/formats/3d-tiles), [I3S 1.7/1.8 and Point Cloud 2.x](/docs/modules/i3s/formats/i3s) | [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), [`I3SLoader`](/docs/modules/i3s/api-reference/i3s-loader), [`I3SSource`](/docs/modules/tiles/api-reference/i3s-source) |
| Point-cloud delivery | [COPC 1.0](/docs/modules/copc/formats/copc), [Potree 1.4–1.8](/docs/modules/potree), [LAS/LAZ](/docs/modules/las/formats/las) | [`COPCSourceLoader`](/docs/modules/copc/api-reference/copc-source-loader), [`PotreeSourceLoader`](/docs/modules/potree/api-reference/potree-source-loader), [`LASLoader`](/docs/modules/las/api-reference/las-loader) |
| Geometry compression | [Draco](/docs/modules/draco/formats/draco), [meshopt compression](/docs/modules/gltf/formats/gltf#meshopt-compression) | [`DracoLoader`](/docs/modules/draco/api-reference/draco-loader), [`DracoWriter`](/docs/modules/draco/api-reference/draco-writer), glTF extension processing |
| Texture delivery | [Basis Universal](/docs/modules/textures/formats/basis), [KTX/KTX2](/docs/modules/textures/formats/ktx) | [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader), [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader), [`KTX2BasisWriter`](/docs/modules/textures/api-reference/ktx2-basis-texture-writer) |

## What the loaders preserve

The 3D loaders are standards-shaped by default. They preserve source metadata and extension data
where possible, while optional post-processing can resolve external assets, decompress geometry,
negotiate textures, or adapt data into the shape a renderer needs.

- **Scenegraph data** retains nodes, meshes, materials, animations, extensions, and application data.
- **Tile data** retains bounding volumes, geometric error, refinement, implicit-tiling metadata, and
  the relationship between a tile and its content.
- **Point-cloud data** can be returned as meshes, typed point-list data, or Mesh Arrow tables with
  selected fields and explicit coordinate metadata.
- **Texture data** exposes mip levels, array or cube layouts, GPU-oriented formats, and the source
  metadata needed for runtime selection.

Workers are available for the expensive decoders, and source APIs can combine range requests,
caching, cancellation, and level-of-detail selection. Those are runtime choices; the format
implementations remain independently usable in Node.js and in the browser.

<ReferenceBoundary
  title="Format-by-format coverage"
  description="The pages below contain the compatibility matrices, extension notes, writer boundaries, and implementation details for each part of the 3D stack."
  tone="blue"
/>

## Scene formats

### glTF and GLB

The glTF implementation covers the core 2.0 scene model and selected draft 2.1 features such as
unified file references, external assets, and culling shapes. It also processes Draco, meshopt, and
KTX2/Basis extensions, with the standards-shaped source document available when applications need
to make their own decisions.

Read the [glTF format coverage](/docs/modules/gltf/formats/gltf) and the
[`GLTFLoader` API](/docs/modules/gltf/api-reference/gltf-loader).

### OpenUSD

OpenUSD is available as a scene loader for applications that need a USD-shaped interchange entry
point. See the [OpenUSD format page](/docs/modules/scene/formats/usd) and
[`USDLoader`](/docs/modules/scene/api-reference/usd-loader).

## Tiled worlds

3D Tiles and I3S describe spatial hierarchies rather than a single mesh. Their source and traversal
APIs handle visibility, geometric error, refinement, linked content, and progressive requests while
leaving final rendering to the application or visualization framework.

- [3D Tiles compatibility](/docs/modules/3d-tiles/formats/3d-tiles)
- [I3S compatibility](/docs/modules/i3s/formats/i3s)
- [3D Tiles loader](/docs/modules/3d-tiles/api-reference/tiles-3d-loader)
- [I3S loader and profiles](/docs/modules/i3s/api-reference/i3s-loader)

## Point clouds

COPC combines LAS 1.4 point records with an octree and byte-range layout. Potree uses a related
hierarchical delivery model with several 1.x metadata and node layouts. LAS/LAZ remains the
standards-focused sequential format underneath many point-cloud workflows.

- [COPC compatibility and scan behavior](/docs/modules/copc/formats/copc)
- [Potree compatibility and source behavior](/docs/modules/potree)
- [LAS/LAZ compatibility](/docs/modules/las/formats/las)
- [Mesh and point-cloud data shapes](/docs/specifications/category-mesh)

## Compression and textures

Draco and meshopt compress geometry. Basis Universal and KTX2 compress or package texture payloads
for runtime transcoding and GPU upload. They are often embedded inside glTF, 3D Tiles, and I3S
delivery paths, so their compatibility pages are part of the 3D story rather than unrelated utility
documentation.

- [Draco format and writer boundaries](/docs/modules/draco/formats/draco)
- [Meshopt support in glTF](/docs/modules/gltf/formats/gltf#meshopt-compression)
- [Basis Universal](/docs/modules/textures/formats/basis)
- [KTX/KTX2](/docs/modules/textures/formats/ktx)
