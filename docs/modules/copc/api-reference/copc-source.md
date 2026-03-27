# COPCSource

`COPCSource` creates a `DataSource` for [COPC](/docs/modules/copc/formats/copc) point clouds.

It can be used directly for metadata and node access, and it also satisfies the point-cloud tileset source contract consumed by [`PointCloudTileset`](/docs/modules/tiles/api-reference/point-cloud-tileset).

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {PointCloudTileset} from '@loaders.gl/tiles';
import {COPCSource} from '@loaders.gl/copc';

const dataSource = createDataSource(COPC_URL, [COPCSource], {
  core: {type: 'copc'},
  copc: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## Notes

- Automatic URL detection is conservative and only matches explicit COPC-style URLs such as `.copc.laz`.
- For plain `.laz` URLs that are known to be COPC, pass `core.type: 'copc'`.
- The source exposes normalized root/child tile headers and full per-node point content loading.
