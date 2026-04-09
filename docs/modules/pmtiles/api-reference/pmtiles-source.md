# PMTilesSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `PMTilesSource` reads individual tiles from a PMTiles archive file.
For remote URL archives, tile requests are queued briefly and nearby HTTP byte ranges are
coalesced before the archive bytes are fetched.

| Loader         | Characteristic                                   |
| -------------- | ------------------------------------------------ |
| File Extension | `.pmtiles`                                       |
| File Type      | Binary Archive                                   |
| File Format    | [PMTiles](/docs/modules/pmtiles/formats/pmtiles) |
| Data Format    | Metadata                                         |

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';

const source = createDataSource(url, [PMTilesSource]);
const tile = await source.getTile(...);
```

### Batched tile reads

`getTile()` and `getTileData()` automatically participate in delayed range batching.
Requests made during the same `tileRangeRequest.batchDelayMs` window are started together;
tile-content byte ranges that are close together are fetched as one merged HTTP `Range`
request and then sliced back into per-tile results.

Applications that already know the complete tile set can also call the explicit batch API:

```typescript
const tilePromises = source.getTileDataBatch?.([tileA, tileB, tileC]);
```

See the [multi-range loading guide](../../../developer-guide/multi-range-loading.md) for the
shared scheduler model and option tradeoffs.

## Options

| Option                                | Type      | Default | Description                                                                 |
| ------------------------------------- | --------- | ------- | --------------------------------------------------------------------------- |
| `tileRangeRequest.batchDelayMs`       | `number`  | `50`    | Time to wait for sibling tile requests before starting PMTiles tile lookup.  |
| `tileRangeRequest.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby tile content. |
| `tileRangeRequest.maxGapBytes`        | `number`  | `65536` | Compatibility alias for `rangeExpansionBytes`.                              |
| `tileRangeRequest.maxMergedBytes`     | `number`  | `8388608` | Maximum size of one merged byte-range request.                             |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                     |
| `tileRangeRequest.stats`              | `Stats`   | none     | Optional probe.gl Stats object that receives range batching counters.       |
| `tileRangeRequest.onEvent`            | `function` | none    | Optional diagnostics callback for queued, batched, completed, failed, and aborted range requests. |

## Notes

- Blob / in-memory PMTiles archives are read directly and do not add the default network
  batching delay.
- PMTiles metadata, header, and directory handling is still delegated to the `pmtiles` package.
- PMTiles v2 archives may fall back to the package's normal single-tile lookup path.
- PMTiles URL sources expect byte-range fetches to return `206 Partial Content`. If a server
  ignores `Range` and responds with `200 OK`, loaders.gl aborts the fetch and rejects the tile
  request instead of downloading the full archive.
