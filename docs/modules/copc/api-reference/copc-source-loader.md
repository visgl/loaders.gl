import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';

# COPCSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

<CopcDocsTabs active="source" />

`COPCSourceLoader` creates a point-cloud tile source for Cloud Optimized Point Cloud (`.copc.laz`) datasets.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {COPCSourceLoader} from '@loaders.gl/copc';
import {PointCloudTileset} from '@loaders.gl/tiles';

const dataSource = createDataSource(url, [COPCSourceLoader], {
  copc: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## Data Source

The created data source exposes the point-cloud tile methods used by `PointCloudTileset`:

- `getMetadata()` returns COPC metadata, inferred bounds, and an initial view state.
- `getRootTile()` returns the root octree tile header.
- `getChildren(tile)` returns available child tile headers.
- `loadTileContent(tile)` returns normalized point positions, optional colors, point count, and cartographic origin.
- `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively after the selected node range has been fetched. The TypeScript LAZ variant is required. `options.batchSize` controls the maximum points per table, `options.columns` can request positions only, and `options.signal` cancels the request/decode.
- `loadHierarchyInBatches(options)` yields hierarchy pages and their discovered nodes as they are fetched.

For TypeScript position-only batches, `loadTileContentInBatches` splits the node range into sequential requests and can emit positions as soon as the Point14 layer arrives. RGB requests still use one complete node range until progressive RGB decoding is implemented. `options.rangeChunkSize` controls the position-only request size.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.sourceCoordinateSystem` | `string` | Auto-detected from COPC WKT | Coordinate system definition used when the source metadata does not include WKT. |
| `copc.rangeChunkSize` | `number` | `65536` | Default byte size for position-only TypeScript COPC node range requests. |
