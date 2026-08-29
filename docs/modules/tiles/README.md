---
title: '@loaders.gl/tiles'
description: Traverse source-backed 2D and 3D tilesets with selection, caching, and refreshable data sources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles runtime module"
  title="Let the viewport decide which data arrives."
  description="The tiles module supplies source-backed 2D and 3D traversal primitives. It coordinates hierarchy selection, request scheduling, caching, and refresh while leaving the final rendering policy to the application."
  tone="violet"
  meta={['Tileset3D', 'PointCloudTileset', 'RasterSet']}
  links={[
    {label: '3D Tiles category', to: '/docs/specifications/category-3d-tiles'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The tiles runtime"
  title="Select, request, cache, refresh."
  description="A tileset is a data source with a hierarchy. The runtime tracks what is visible, requests the corresponding content, and releases data that is no longer useful under the configured cache policy."
  tone="violet"
  items={[
    {label: 'Selection', value: 'Viewport, bounds, geometric error, and level of detail'},
    {label: 'Requests', value: 'Priority scheduling, cancellation, and refresh'},
    {label: 'Memory', value: 'Cache budgets and eviction of no-longer-needed content'},
    {label: 'Outputs', value: '3D tiles, point clouds, raster tiles, and source metadata'}
  ]}
/>

<ReferenceBoundary
  title="Tiles runtime details"
  description="The sections below document the tile hierarchy, traversal lifecycle, cache, coordinate model, and helper classes."
  tone="violet"
/>

## Choose a runtime

The module separates format-specific sources from the runtime that selects and manages data. Start
with the class that matches the delivery problem:

| Need | Runtime | What it provides |
| --- | --- | --- |
| Hierarchical 3D Tiles or I3S | [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) | View-dependent traversal, culling, request scheduling, cache management, and selected content |
| Point-cloud octrees | [`PointCloudTileset`](/docs/modules/tiles/api-reference/point-cloud-tileset) | Visible-node selection and point budgets for COPC and Potree sources |
| 2D tile grids | [`Tileset2D`](/docs/modules/tiles/api-reference/tileset-2d) | Shared fetched content with per-consumer selection and visibility state |
| Viewport-driven rasters | [`RasterSet`](/docs/modules/tiles/api-reference/raster-set) | Metadata loading, debounced raster requests, and lifecycle events |

Format-specific sources implement the source contract consumed by `Tileset3D`. See
[`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source),
[`Tiles3DSource`](/docs/modules/tiles/api-reference/tiles-3d-source), and
[`I3SSource`](/docs/modules/tiles/api-reference/i3s-source) for the source boundary.

## Typical 3D flow

Create a source with the loader for the format, give it to `Tileset3D`, and select tiles whenever
the viewport changes. The runtime keeps the hierarchy, requests, cache, and selected set in sync.

```typescript
import {WebMercatorViewport} from '@deck.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

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

Call `selectTiles` again when the camera changes. Tile content may continue arriving after a
selection pass, and `onTileLoad` reports newly ready content. Use `update(viewport)` only when a
fire-and-forget compatibility wrapper is preferable; new code should generally await
`selectTiles`.

For point clouds, use [`PointCloudTileset`](/docs/modules/tiles/api-reference/point-cloud-tileset)
with a COPC or Potree source and read its `selectedTiles`. For 2D data, use
[`Tileset2D`](/docs/modules/tiles/api-reference/tileset-2d); for raster services, use
[`RasterSet`](/docs/modules/tiles/api-reference/raster-set).

## Shared tile model

The runtime keeps three related layers distinct:

| Layer | Carries |
| --- | --- |
| Source metadata | Format version, coordinate context, hierarchy references, and content URLs |
| Runtime tile | Bounds, children, refinement, level-of-detail state, selection, and content state |
| Tile content | Decoded application data, transforms, origins, attributes, and format-specific metadata |

`Tile3D` is the runtime record for one hierarchical tile. Its detailed lifecycle and visibility
helpers are documented in the [`Tile3D` reference](/docs/modules/tiles/api-reference/tile-3d).
The [3D Tiles category specification](/docs/specifications/category-3d-tiles) describes the
application-facing shape for decoded tile content.

## Coordinate context

Source metadata preserves the coordinate reference system and any transforms needed to place
content. Depending on the source and requested options, applications may work with:

- fixed-frame Cartesian positions, typically WGS84 ECEF coordinates
- local or cartographic positions relative to a tile origin, with positions expressed in meters

I3S adds explicit horizontal and vertical placement options; see
[I3S coordinate reference systems](/docs/modules/i3s/concepts/coordinate-reference-systems) and
[vertical coordinate systems](/docs/developer-guide/vertical-coordinate-systems). For 3D Tiles
payload and metadata details, see the [3D Tiles format page](/docs/modules/3d-tiles/formats/3d-tiles).
