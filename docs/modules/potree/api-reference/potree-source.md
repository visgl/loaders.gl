# PotreeSource

:::caution
Experimental
:::

`PotreeSource` reads point-cloud nodes from Potree datasets.

It supports the existing loaders.gl path for legacy `cloud.js` datasets and adds URL range
loading for PotreeConverter 2.x datasets that contain `metadata.json`, `hierarchy.bin`, and
`octree.bin`.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PotreeSource} from '@loaders.gl/potree';

const source = createDataSource('/pointcloud/metadata.json', [PotreeSource]);

await source.init();
const root = await source.loadNodeContent('r');
const child = await source.loadNodeContent('r0');
```

## Methods

### `init(): Promise<void>`

Loads metadata and the first hierarchy chunk. PotreeConverter 2.x URL datasets read
`metadata.json` first and then range-read the first chunk from `hierarchy.bin`.

### `isSupported(): boolean`

Returns whether the loaded dataset is supported by this Source.

### `loadNodeContent(nodeName): Promise<Mesh | null>`

Loads a Potree octree node. For PotreeConverter 2.x URL datasets, node payloads are range-read
from `octree.bin`. Proxy hierarchy chunks are loaded from `hierarchy.bin` when traversal reaches
them.

### `isNodeAvailable(nodeName): Promise<boolean>`

Checks whether a legacy Potree node exists in the loaded hierarchy.

## Batched Range Reads

`loadNodeContent()` calls for PotreeConverter 2.x URL datasets queue for
`tileRangeRequest.batchDelayMs`. When the batch starts, node payload ranges in `octree.bin`
are passed through the shared range scheduler. Nearby nodes can be fetched as one expanded
HTTP `Range` request and sliced before decode.

See the [multi-range loading guide](../../../developer-guide/multi-range-loading.md) for the
shared scheduler model and option tradeoffs.

## Options

| Option                                  | Type     | Default   | Description |
| --------------------------------------- | -------- | --------- | ----------- |
| `tileRangeRequest.batchDelayMs`         | `number` | `50`      | Time to wait for sibling node requests before loading point data. |
| `tileRangeRequest.rangeExpansionBytes`  | `number` | `65536`   | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby Potree nodes. |
| `tileRangeRequest.maxGapBytes`          | `number` | `65536`   | Compatibility alias for `rangeExpansionBytes`. |
| `tileRangeRequest.maxMergedBytes`       | `number` | `8388608` | Maximum size of one merged byte-range request. |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`      | Reserved concurrency hint for range-request transports. |

## Limitations

- Legacy `cloud.js` datasets are still loaded as separate metadata, hierarchy, and content
  files.
- PotreeConverter 2.x `DEFAULT` and `BROTLI` encodings are supported for common position,
  color, and scalar attributes.
- `loadNodeContent()` is still the primary Source method; this Source does not expose z/x/y
  map tile addressing.
