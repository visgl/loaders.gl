---
title: PointCloudTileset
description: Traverse source-backed point-cloud octrees with a small common runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud tiles runtime"
  title="Traverse large point clouds without loading every point."
  description="`PointCloudTileset` provides a focused traversal manager for source-backed octree formats such as COPC and Potree. It selects visible tiles, applies a point budget, and exposes loaded data to the renderer."
  tone="violet"
  meta={['COPC and Potree', 'Octree traversal', 'Point budgets']}
  links={[
    {label: 'Tiles module', to: '/docs/modules/tiles'},
    {label: 'COPC source', to: '/docs/modules/copc/api-reference/copc-source-loader'},
    {label: 'Potree source', to: '/docs/modules/potree/api-reference/potree-source-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The point-cloud path"
  title="Open a source. Select visible nodes. Render what is ready."
  description="Format-specific sources provide metadata and tile content; `PointCloudTileset` keeps the application-facing traversal lifecycle consistent across octree formats."
  tone="violet"
  items={[
    {label: 'Source', value: 'A DataSource with point-cloud tile methods'},
    {label: 'Selection', value: 'Viewport-driven octree traversal'},
    {label: 'Budget', value: 'Screen-space error, depth, and point limits'},
    {label: 'Output', value: 'Loaded and selected point-cloud tiles'}
  ]}
/>

<ReferenceBoundary
  title="Traversal contract"
  description="The sections below cover construction, selection, callbacks, options, format limits, and source requirements."
  tone="violet"
/>

`PointCloudTileset` is a small point-cloud-specific tileset manager in `@loaders.gl/tiles`.

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for current
LAS, COPC, and Potree CRS discovery, preservation, and reprojection limitations.

It is intended for source-backed octree formats such as Potree and COPC and exposes a deliberately small subset of the `Tileset3D` interaction model:

- construct from a `DataSource`
- call `selectTiles(viewport)` when the view changes
- read `tiles`, `selectedTiles`, `frameNumber`, and `isLoaded()`
- react to `onTileLoad`, `onTileError`, and `onUpdate`

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {PointCloudTileset} from '@loaders.gl/tiles';
import {PotreeSourceLoader} from '@loaders.gl/potree';

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

## Constructor

```ts
new PointCloudTileset(dataSource, options?)
```

- `dataSource`: a `DataSource` that satisfies the point-cloud tileset source contract
- `options.debounceTime`: debounce interval for `selectTiles`
- `options.maximumScreenSpaceError`: refinement threshold for viewport-driven traversal
- `options.maxDepth`: optional traversal depth limit
- `options.onTileLoad`: called when tile content becomes available
- `options.onTileError`: called when tile content fails to load
- `options.onUpdate`: called when the selected tile set changes

## Notes

- This class is point-cloud-only and octree-only.
- It does not reuse `Tileset3D`, `Tile3D`, 3D Tiles metadata, or I3S-specific traversal logic.
- COPC URL auto-detection is intentionally conservative. For ambiguous `.laz` URLs, pass `core.type: 'copc'`.
