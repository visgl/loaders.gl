Tiles runtime module

# Let the viewport decide which data arrives.

The tiles module supplies source-backed 2D and 3D traversal primitives. It coordinates hierarchy selection, request scheduling, caching, and refresh while leaving the final rendering policy to the application.

[3D Tiles category](https://loaders.gl/next/docs/specifications/category-3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-3d-tiles.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

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

The tiles runtime

## Select, request, cache, refresh.

A tileset is a data source with a hierarchy. The runtime tracks what is visible, requests the corresponding content, and releases data that is no longer useful under the configured cache policy.

01

Selection

Viewport, bounds, geometric error, and level of detail

02

Requests

Priority scheduling, cancellation, and refresh

03

Memory

Cache budgets and eviction of no-longer-needed content

04

Outputs

3D tiles, point clouds, raster tiles, and source metadata

Detailed guide

## Tiles runtime details

The sections below document the tile hierarchy, traversal lifecycle, cache, coordinate model, and helper classes.

## Choose a runtime[​](#choose-a-runtime "Direct link to Choose a runtime")

The module separates format-specific sources from the runtime that selects and manages data. Start with the class that matches the delivery problem:

| Need                         | Runtime                                                                                                        | What it provides                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Hierarchical 3D Tiles or I3S | [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)                  | View-dependent traversal, culling, request scheduling, cache management, and selected content |
| Point-cloud octrees          | [`PointCloudTileset`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md) | Visible-node selection and point budgets for COPC, Potree and dynamic decoded point sources   |
| 2D tile grids                | [`Tileset2D`](https://loaders.gl/next/docs/modules/tiles/api-reference/tileset-2d.md)                     | Shared fetched content with per-consumer selection and visibility state                       |
| Viewport-driven rasters      | [`RasterSet`](https://loaders.gl/next/docs/modules/tiles/api-reference/raster-set.md)                     | Metadata loading, debounced raster requests, and lifecycle events                             |

Format-specific sources implement the source contract consumed by `Tileset3D`. See [`Tileset3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d-source.md), [`Tiles3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md), and [`I3SSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/i3s-source.md) for the source boundary.

## Typical 3D flow[​](#typical-3d-flow "Direct link to Typical 3D flow")

Create a source with the loader for the format, give it to `Tileset3D`, and select tiles whenever the viewport changes. The runtime keeps the hierarchy, requests, cache, and selected set in sync.

```
import {WebMercatorViewport} from '@deck.gl/core';

import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';

import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';



const source = new Tiles3DSource({

  url: 'https://assets.ion.cesium.com/43978/tileset.json',

  loader: Tiles3DLoader

});

const tileset = new Tileset3D(source, {

  onTileLoad: tile => console.log(tile)

});

const viewport = new WebMercatorViewport({

  width: 800,

  height: 600,

  latitude: 37.7749,

  longitude: -122.4194,

  zoom: 12

});



await tileset.selectTiles(viewport);

const visibleTiles = tileset.selectedTiles;
```

Call `selectTiles` again when the camera changes. Tile content may continue arriving after a selection pass, and `onTileLoad` reports newly ready content. Use `update(viewport)` only when a fire-and-forget compatibility wrapper is preferable; new code should generally await `selectTiles`.

For point clouds, use [`PointCloudTileset`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md) with a COPC or Potree source and read its `selectedTiles`. For 2D data, use [`Tileset2D`](https://loaders.gl/next/docs/modules/tiles/api-reference/tileset-2d.md); for raster services, use [`RasterSet`](https://loaders.gl/next/docs/modules/tiles/api-reference/raster-set.md).

Decoded point datasets can also use [`PointCloudTileSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tile-source.md) to build an additive octree in the browser, with lazy child partitions and explicit memory limits.

## Shared tile model[​](#shared-tile-model "Direct link to Shared tile model")

The runtime keeps three related layers distinct:

| Layer           | Carries                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Source metadata | Format version, coordinate context, hierarchy references, and content URLs              |
| Runtime tile    | Bounds, children, refinement, level-of-detail state, selection, and content state       |
| Tile content    | Decoded application data, transforms, origins, attributes, and format-specific metadata |

`Tile3D` is the runtime record for one hierarchical tile. Its detailed lifecycle and visibility helpers are documented in the [`Tile3D` reference](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tile-3d.md). The [3D Tiles category specification](https://loaders.gl/next/docs/specifications/category-3d-tiles.md) describes the application-facing shape for decoded tile content.

## Coordinate context[​](#coordinate-context "Direct link to Coordinate context")

Source metadata preserves the coordinate reference system and any transforms needed to place content. Depending on the source and requested options, applications may work with:

* fixed-frame Cartesian positions, typically WGS84 ECEF coordinates
* local or cartographic positions relative to a tile origin, with positions expressed in meters

I3S adds explicit horizontal and vertical placement options; see [I3S coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md) and [vertical coordinate systems](https://loaders.gl/next/docs/developer-guide/vertical-coordinate-systems.md). For 3D Tiles payload and metadata details, see the [3D Tiles format page](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md).
