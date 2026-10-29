Tiled scene module

![](/next/images/format-logos/3d-tiles-logo.png)

# @loaders.gl/tiles-3d/3d-tiles

Resolve tileset structure, linked content, and level-of-detail decisions without making the application understand every 3D Tiles detail.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

 

View-dependent delivery

## A hierarchy turns one scene into useful requests.

Tiled formats keep spatial structure and level-of-detail metadata alongside their payloads. A runtime can select visible leaves instead of downloading the complete world.

Dataset hierarchy

root · world boundscoarse content and children

region westgeometric error

region eastgeometric error

leaf · L06leaf · L07leaf · L06leaf · L08

selec&#x74;**→**

Current view

viewport + error budget

boundsSSEpriority

selected contentFetch only the leaves that can contribute to this view.

glTFpointstextures

[Tileset3D traversal ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

3D Tiles and I3S differ in their resource layouts, but the application-facing idea is the same: preserve the hierarchy, select by view, and request content progressively.

The `@loaders.gl/tiles-3d/3d-tiles` module supports loading and traversing 3D Tiles 1.x and an experimental subset of the draft glTF-based 3D Tiles 2.0 representation. Draft resources are detected from their structure, so `.gltf`, `.glb`, signed, and extensionless URLs use the same loader entry point.

The 5.0 development line brings a substantially richer runtime: ordered multi-content tiles, lazy implicit subtrees, transform-aware LOD, request prioritization, decoded metadata, and public renderer-neutral content contracts. These capabilities are available without adopting a particular renderer. The [experimental 3D Tiles 2.0 profile](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/3d-tiles-2-0-experimental.md) adds draft hierarchy, spatial, package, and vector-topology support with explicit compatibility limits.

See the [3D Tiles format compatibility matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md) for a capability-by-capability summary of parser, traversal, extension, and renderer-facing support. The [styling and feature access guide](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/styling-and-feature-access.md) documents renderer-neutral property inputs without claiming style-expression or GPU support.

The 3D Tiles module

## Keep the hierarchy. Request the visible pieces.

The module separates tileset parsing from view-dependent traversal, so applications can work with large worlds while retaining bounds, refinement, content references, and source metadata.

01

Parse

Tileset JSON, archives, payloads, and extensions

02

Traverse

Bounds, screen-space error, refinement, and visibility

03

Resolve

glTF, points, composites, nested tilesets, and subtrees

04

Integrate

Tileset3D and Tile3D for application-owned rendering

## Standards[​](#standards "Direct link to Standards")

* [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
* [3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## What's available in 5.0[​](#whats-available-in-50 "Direct link to What's available in 5.0")

| Area                  | Landed capability                                                                                                                                     | Learn more                                                                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content               | Single and ordered multiple contents, nested tilesets, composites, archives, and structure-first resource detection.                                  | [Content contracts](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/renderer-contracts-and-metadata.md)                                                                                                                   |
| Hierarchy             | Lazy QUADTREE/OCTREE subtrees, sparse availability, multiple content streams, and S2 descendants.                                                     | [Implicit tiling](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md)                                                                                                                        |
| Selection             | Transform-scaled 1.x geometric error, logical-pixel perspective/orthographic SSE, ADD/REPLACE and skip-LOD traversal.                                 | [SSE and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md)                                                                                                                              |
| Requests and memory   | Viewer-request-volume gating, progressive/foveated priority, cancellation, byte-based caching, and traversal snapshots.                               | [Scheduling](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md), [observability](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/observability-and-benchmarks.md) |
| Metadata and features | Decoded property-table columns, default/noData-aware rows, hierarchy-aware batch-table access, feature-ID declarations, and style-input snapshots.    | [Styling and feature access](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/styling-and-feature-access.md)                                                                                                               |
| Spatial data          | Transformed content bounds, union/indexed render culling, CRS/epoch discovery, nonlinear reprojection, and nested CRS placement.                      | [Coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/coordinate-reference-systems.md)                                                                                                           |
| New payloads          | Gaussian primitive descriptors, SPZ v2/v3/v4 decoding, an optional embedded SPZ2 decoder hook, vector topology, and metadata-first voxel descriptors. | [Extension contracts](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/gaussian-vector-voxel-extensions.md)                                                                                                                |

These are loader/runtime capabilities, not a claim of complete Cesium renderer parity. Consult the [format matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md) for partial support and experimental boundaries.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tiles-3d @loaders.gl/tiles
```

## API[​](#api "Direct link to API")

The module provides loaders for the individual 3D Tiles payload forms:

* [`Tiles3DLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md), a loader for loading a top-down or nested tileset and its tiles.
* [`CesiumIonLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/cesium-ion-loader.md), a `Tiles3DLoader` variant that resolves credentials and tileset URLs from Cesium ion.

For dynamic selection and loading of tilesets larger than browser memory, use the helper classes in the `@loaders.gl/tiles` module:

* [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md) to work with the loaded tileset.
* [`Tile3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tile-3d.md) to access data for a specific tile.

The [3D Tiles runtime concepts suite](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md) explains the complete path from hierarchy traversal to rendering:

* [Resource resolution and content detection](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)
* [Experimental 3D Tiles 2.0 profile](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/3d-tiles-2-0-experimental.md)
* [Tile hierarchy and refinement](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/tile-hierarchy-and-refinement.md)
* [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md)
* [Screen-space error and level of detail](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md)
* [Request scheduling, progressive loading, and foveated requests](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md)
* [Caching and memory](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory.md)
* [Runtime tuning and diagnostics](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/runtime-tuning-and-diagnostics.md)
* [Runtime observability and benchmark baselines](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/observability-and-benchmarks.md)
* [Styling and feature access](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/styling-and-feature-access.md)
* [Renderer contracts and metadata](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/renderer-contracts-and-metadata.md)
* [Gaussian, vector, and voxel extensions](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/gaussian-vector-voxel-extensions.md)
* [Coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/coordinate-reference-systems.md)
* [Correctness and conformance](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/correctness-and-conformance.md)

Detailed guide

## Module APIs and runtime concepts

The reference below covers installation, loaders, traversal helpers, usage, runtime concepts, and the current compatibility boundaries.

## Usage[​](#usage "Direct link to Usage")

Basic API usage is illustrated in the following snippet. Load the tileset header, create a `Tileset3D` instance, and keep selecting tiles as the camera moves:

```
import {coreApi} from '@loaders.gl/core';

import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';

import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';



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

## Compatibility boundaries[​](#compatibility-boundaries "Direct link to Compatibility boundaries")

Region bounding volumes and viewer request volumes are supported. Tile volumes govern hierarchy traversal; per-content volumes and optional clipping planes govern render visibility. Request volumes gate requests and are not a replacement for either kind of culling.

Metadata decoding and style-input helpers do not evaluate a styling language or implement picking. GPU upload, draw policy, splat sorting, vector triangulation, and voxel ray marching belong to consumers. Voxel support is descriptor-only, and the SPZ2 bridge requires an application-supplied decoder. Draft 2.0 support is a tested subset, not full draft conformance. No native IFC, STEP, or DWG parser is included.

## Attribution[​](#attribution "Direct link to Attribution")

`@loaders.gl/tiles-3d/3d-tiles` includes code derived from the [Cesium repository](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2.0 license and is maintained in collaboration with the Cesium engineering team.

## Archive output[​](#archive-output "Direct link to Archive output")

Use [Tiles3DArchiveWriter](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-archive-writer.md) to package already-authored 3D Tiles resources as a portable indexed `.3tz` archive.

### Indexed archive reads[​](#indexed-archive-reads "Direct link to Indexed archive reads")

`parse3DTilesArchive(readableFile)` returns a `Tiles3DArchive` with the archive index loaded once. Use it for repeated entry reads from a `BlobFile`, `HttpFile` or other `ReadableFile`; constructing `Tiles3DArchive` without an index falls back to ZIP cached ZIP directory lookup. The archive owns the readable file; call `archive.close()` in a `finally` block after use. Archives without `@3dtilesIndex1@` build an index from their ZIP headers.

The one-shot `Tiles3DArchiveFileLoader.parseFile()` extraction closes its supplied file after success or failure. Use `parse3DTilesArchive` when several resources share one file.
