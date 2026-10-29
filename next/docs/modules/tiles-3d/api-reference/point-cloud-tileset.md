Point-cloud tiles runtime

# Traverse large point clouds without loading every point.

`PointCloudTileset` provides a focused traversal manager for source-backed octree formats such as COPC and Potree. It selects visible tiles, applies a point budget, and exposes loaded data to the renderer.

[Tiles module](https://loaders.gl/next/docs/modules/tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles.md)[COPC source](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)[Potree source](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

The point-cloud path

## Open a source. Select visible nodes. Render what is ready.

Format-specific sources provide metadata and tile content; \`PointCloudTileset\` keeps the application-facing traversal lifecycle consistent across octree formats.

01

Source

A DataSource with point-cloud tile methods

02

Selection

Viewport-driven octree traversal

03

Budget

Screen-space error, depth, and point limits

04

Output

Loaded and selected point-cloud tiles

Detailed guide

## Traversal contract

The sections below cover construction, selection, callbacks, options, format limits, and source requirements.

`PointCloudTileset` is a small point-cloud-specific tileset manager in `@loaders.gl/tiles`.

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for current LAS, COPC, and Potree CRS discovery, preservation, and reprojection limitations.

It is intended for source-backed octree formats such as Potree and COPC and exposes a deliberately small subset of the `Tileset3D` interaction model:

* construct from a `DataSource`
* call `selectTiles(viewport)` when the view changes
* read `tiles`, `selectedTiles`, `frameNumber`, and `isLoaded()`
* react to `onTileLoad`, `onTileError`, and `onUpdate`

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';

import {PotreeSourceLoader} from '@loaders.gl/tiles-3d/potree';



const dataSource = createDataSource(POTREE_URL, [PotreeSourceLoader], {

  core: {type: 'potree'},

  potree: {}

});



const tileset = new PointCloudTileset(dataSource, {

  maximumScreenSpaceError: 24,

  onTileLoad: (tile) => console.log(tile.id)

});



await tileset.selectTiles(viewport);

const visibleTiles = tileset.selectedTiles;
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new PointCloudTileset(dataSource, options?)
```

* `dataSource`: a `DataSource` that satisfies the point-cloud tileset source contract
* `options.debounceTime`: debounce interval for `selectTiles`
* `options.maximumScreenSpaceError`: refinement threshold for viewport-driven traversal
* `options.maxDepth`: optional traversal depth limit
* `options.onTileLoad`: called when tile content becomes available
* `options.onTileError`: called when tile content fails to load
* `options.onUpdate`: called when the selected tile set changes

## Notes[​](#notes "Direct link to Notes")

* This class is point-cloud-only and octree-only.
* It does not reuse `Tileset3D`, `Tile3D`, 3D Tiles metadata, or I3S-specific traversal logic.
* COPC URL auto-detection is intentionally conservative. For ambiguous `.laz` URLs, pass `core.type: 'copc'`.

## Dynamic decoded point data[​](#dynamic-decoded-point-data "Direct link to Dynamic decoded point data")

Use [`PointCloudTileSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tile-source.md) to build an additive octree from a decoded Mesh or Arrow point table. It preserves native coordinates and attributes, discovers children lazily, and implements this same source contract.
