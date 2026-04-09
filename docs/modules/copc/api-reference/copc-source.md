# COPCSource

:::caution
Experimental
:::

The `COPCSource` reads hierarchy and point data from Cloud-Optimized Point Cloud (`.copc.laz`)
files. Remote URL sources use HTTP range requests; point/tile requests made close together
are queued briefly and nearby byte ranges are fetched with coalesced range reads.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {COPCSource} from '@loaders.gl/copc';

const source = createDataSource(url, [COPCSource]);

const metadata = await source.getMetadata();
const schema = await source.getSchema();

// COPC hierarchy node x/y/z/depth. getTile() maps z/x/y to depth 0 for now.
const point = await source.getPoints({
  nodeIndex: {x: 0, y: 0, z: 0, d: 0}
});
```

## Batched range reads

For URL sources, `getTile()`, `getTileData()`, and `getPoints()` queue for
`tileRangeRequest.batchDelayMs` before point-data loading starts. COPC header and hierarchy
metadata are opened immediately. The underlying COPC byte-range getter uses the shared
range scheduler, so close point-data ranges can be fetched as one HTTP `Range` request and
sliced back into each point/tile promise.

Blob sources read directly from the Blob and do not wait for the batching delay.

See the [multi-range loading guide](../../../developer-guide/multi-range-loading.md) for the
shared scheduler model and option tradeoffs.

## Options

| Option                                | Type     | Default | Description                                                                |
| ------------------------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `tileRangeRequest.batchDelayMs`       | `number` | `50`    | Time to wait for sibling point/tile requests before loading point data.    |
| `tileRangeRequest.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby COPC chunks. |
| `tileRangeRequest.maxGapBytes`        | `number` | `65536` | Compatibility alias for `rangeExpansionBytes`.                             |
| `tileRangeRequest.maxMergedBytes`     | `number` | `8388608` | Maximum size of one merged byte-range request.                           |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                    |

## Limitations

- This source currently returns a sample point array for a COPC node. A full point table /
  columnar result is still future work.
- `getTileData()` is a deck.gl-compatible wrapper over `getTile()`; it does not perform
  viewport-aware LOD selection yet.
