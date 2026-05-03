import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';

# PotreeSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

<PotreeDocsTabs active="source" />

`PotreeSourceLoader` creates a point-cloud tile source for Potree datasets rooted at a `cloud.js` metadata file or dataset directory.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PotreeSourceLoader} from '@loaders.gl/potree';
import {PointCloudTileset} from '@loaders.gl/tiles';

const dataSource = createDataSource(url, [PotreeSourceLoader], {
  potree: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## Data Source

The created data source exposes the point-cloud tile methods used by `PointCloudTileset`:

- `getMetadata()` returns Potree metadata and an inferred initial view state.
- `getRootTile()` returns the root octree tile header.
- `getChildren(tile)` returns available child tile headers.
- `loadTileContent(tile)` returns normalized point positions, optional colors and normals, point count, and cartographic origin.

## Notes

- Potree 1.x datasets are supported.
- `LAS` and `LAZ` node payloads are loaded through `LASLoader`.
- Binary Potree point attribute payloads are loaded through `PotreeBinLoader`.
