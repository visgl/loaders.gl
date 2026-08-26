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
- `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively after the selected node range has been fetched. The TypeScript LAZ variant is required and `options.batchSize` controls the maximum points per table.

`loadTileContentInBatches` does not yet split the HTTP range request itself. COPC node data is fetched as one complete compressed range because layered LAZ fields need the chunk size metadata and compressed field ranges before decoding can begin. The method avoids building one full decoded Arrow table and is the API boundary for future progressive range delivery.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.sourceCoordinateSystem` | `string` | Auto-detected from COPC WKT | Coordinate system definition used when the source metadata does not include WKT. |
