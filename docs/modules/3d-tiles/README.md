---
title: '@loaders.gl/3d-tiles'
description: Load and traverse large 3D Tiles datasets with standards-aware tile and content handling.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {TiledSceneGraphic} from '@site/src/components/docs/tiled-scene-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiled scene module"
  title="@loaders.gl/3d-tiles"
  description="Resolve tileset structure, linked content, and level-of-detail decisions without making the application understand every 3D Tiles detail."
  tone="violet"
  meta={['3D Tiles', 'Tileset traversal', 'glTF and point clouds']}
/>

<Tiles3DDocsTabs active="module" />

![ogc-logo](../../images/logos/ogc-logo-60.png)
&nbsp;
![3dtiles-logo](./images/3d-tiles-logo-60.png)

<TiledSceneGraphic />

The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles 1.x and an experimental
subset of the draft glTF-based 3D Tiles 2.0 representation. Draft resources are detected from
their structure, so `.gltf`, `.glb`, signed, and extensionless URLs use the same loader entry point.

The 5.0 development line brings a substantially richer runtime: ordered multi-content tiles,
lazy implicit subtrees, transform-aware LOD, request prioritization, decoded metadata, and public
renderer-neutral content contracts. These capabilities are available without adopting a particular
renderer. The [experimental 3D Tiles 2.0 profile](/docs/modules/3d-tiles/concepts/3d-tiles-2-0-experimental)
adds draft hierarchy, spatial, package, and vector-topology support with explicit compatibility limits.

See the [3D Tiles format compatibility matrix](/docs/modules/3d-tiles/formats/3d-tiles) for a capability-by-capability
summary of parser, traversal, extension, and renderer-facing support. The [styling and feature access guide](/docs/modules/3d-tiles/concepts/styling-and-feature-access) documents renderer-neutral property inputs without claiming style-expression or GPU support.

<DocOrientation
  eyebrow="The 3D Tiles module"
  title="Keep the hierarchy. Request the visible pieces."
  description="The module separates tileset parsing from view-dependent traversal, so applications can work with large worlds while retaining bounds, refinement, content references, and source metadata."
  tone="violet"
  items={[
    {label: 'Parse', value: 'Tileset JSON, archives, payloads, and extensions'},
    {label: 'Traverse', value: 'Bounds, screen-space error, refinement, and visibility'},
    {label: 'Resolve', value: 'glTF, points, composites, nested tilesets, and subtrees'},
    {label: 'Integrate', value: 'Tileset3D and Tile3D for application-owned rendering'}
  ]}
/>

## Standards

- [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
- [3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## What's available in 5.0

| Area | Landed capability | Learn more |
| --- | --- | --- |
| Content | Single and ordered multiple contents, nested tilesets, composites, archives, and structure-first resource detection. | [Content contracts](/docs/modules/3d-tiles/concepts/renderer-contracts-and-metadata) |
| Hierarchy | Lazy QUADTREE/OCTREE subtrees, sparse availability, multiple content streams, and S2 descendants. | [Implicit tiling](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees) |
| Selection | Transform-scaled 1.x geometric error, logical-pixel perspective/orthographic SSE, ADD/REPLACE and skip-LOD traversal. | [SSE and LOD](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod) |
| Requests and memory | Viewer-request-volume gating, progressive/foveated priority, cancellation, byte-based caching, and traversal snapshots. | [Scheduling](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities), [observability](/docs/modules/3d-tiles/concepts/observability-and-benchmarks) |
| Metadata and features | Decoded property-table columns, default/noData-aware rows, hierarchy-aware batch-table access, feature-ID declarations, and style-input snapshots. | [Styling and feature access](/docs/modules/3d-tiles/concepts/styling-and-feature-access) |
| Spatial data | Transformed content bounds, union/indexed render culling, CRS/epoch discovery, nonlinear reprojection, and nested CRS placement. | [Coordinate reference systems](/docs/modules/3d-tiles/concepts/coordinate-reference-systems) |
| New payloads | Gaussian primitive descriptors, SPZ v2/v3/v4 decoding, an optional embedded SPZ2 decoder hook, vector topology, and metadata-first voxel descriptors. | [Extension contracts](/docs/modules/3d-tiles/concepts/gaussian-vector-voxel-extensions) |

These are loader/runtime capabilities, not a claim of complete Cesium renderer parity. Consult the
[format matrix](/docs/modules/3d-tiles/formats/3d-tiles) for partial support and experimental boundaries.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/3d-tiles @loaders.gl/tiles
```

## API

The module provides loaders for the individual 3D Tiles payload forms:

- [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), a loader for loading a top-down or nested tileset and its tiles.
- [`CesiumIonLoader`](/docs/modules/3d-tiles/api-reference/cesium-ion-loader), a `Tiles3DLoader` variant that resolves credentials and tileset URLs from Cesium ion.

For dynamic selection and loading of tilesets larger than browser memory, use the helper classes in
the `@loaders.gl/tiles` module:

- [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) to work with the loaded tileset.
- [`Tile3D`](/docs/modules/tiles/api-reference/tile-3d) to access data for a specific tile.

The [3D Tiles runtime concepts suite](/docs/modules/3d-tiles/concepts) explains the complete path from hierarchy traversal to rendering:

- [Resource resolution and content detection](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection)
- [Experimental 3D Tiles 2.0 profile](/docs/modules/3d-tiles/concepts/3d-tiles-2-0-experimental)
- [Tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement)
- [Implicit tiling and lazy subtrees](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees)
- [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod)
- [Request scheduling, progressive loading, and foveated requests](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities)
- [Caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory)
- [Runtime tuning and diagnostics](/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics)
- [Runtime observability and benchmark baselines](/docs/modules/3d-tiles/concepts/observability-and-benchmarks)
- [Styling and feature access](/docs/modules/3d-tiles/concepts/styling-and-feature-access)
- [Renderer contracts and metadata](/docs/modules/3d-tiles/concepts/renderer-contracts-and-metadata)
- [Gaussian, vector, and voxel extensions](/docs/modules/3d-tiles/concepts/gaussian-vector-voxel-extensions)
- [Coordinate reference systems](/docs/modules/3d-tiles/concepts/coordinate-reference-systems)
- [Correctness and conformance](/docs/modules/3d-tiles/concepts/correctness-and-conformance)

<ReferenceBoundary
  title="Module APIs and runtime concepts"
  description="The reference below covers installation, loaders, traversal helpers, usage, runtime concepts, and the current compatibility boundaries."
  tone="violet"
/>

## Usage

Basic API usage is illustrated in the following snippet. Load the tileset header, create a `Tileset3D` instance, and keep selecting tiles as the camera moves:

```typescript
import {coreApi} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const tilesetUrl = 'https://example.com/tileset.json';
const source = new Tiles3DSource({url: tilesetUrl, loader: Tiles3DLoader, coreApi});

const tileset = new Tileset3D(source, {
  onTileLoad: (tile) => console.log(tile)
});

await tileset.selectTiles(viewport);

// Call again whenever the viewport changes.
await tileset.selectTiles(viewport);

// Visible tiles
const visibleTiles = tileset.tiles.filter((tile) => tile.selected);

// Visible tiles may change while content continues loading.
```

## Compatibility boundaries

Region bounding volumes and viewer request volumes are supported. Tile volumes govern hierarchy
traversal; per-content volumes and optional clipping planes govern render visibility. Request
volumes gate requests and are not a replacement for either kind of culling.

Metadata decoding and style-input helpers do not evaluate a styling language or implement picking.
GPU upload, draw policy, splat sorting, vector triangulation, and voxel ray marching belong to
consumers. Voxel support is descriptor-only, and the SPZ2 bridge requires an application-supplied
decoder. Draft 2.0 support is a tested subset, not full draft conformance. No native IFC, STEP, or
DWG parser is included.

## Attribution

`@loaders.gl/3d-tiles` includes code derived from the [Cesium repository](https://github.com/AnalyticalGraphicsInc/cesium)
under the Apache 2.0 license and is maintained in collaboration with the Cesium engineering team.
