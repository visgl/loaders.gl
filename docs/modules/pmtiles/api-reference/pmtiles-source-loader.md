---
title: PMTilesSourceLoader
description: Read tiles from a PMTiles archive with batched range requests.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="PMTiles source loader"
  title="Read archive tiles without downloading the archive."
  description="`PMTilesSourceLoader` turns a PMTiles archive into a tile source. For remote archives it reads the header and directory with byte ranges, queues nearby tile requests, and coalesces compatible ranges before fetching."
  tone="violet"
  meta={['PMTiles v2 and v3', 'HTTP range requests', 'Tile source']}
  links={[
    {label: 'PMTiles module', to: '/docs/modules/pmtiles'},
    {label: 'PMTiles format', to: '/docs/modules/pmtiles/formats/pmtiles'},
    {label: 'Range request guide', to: '/docs/developer-guide/using-range-requests'}
  ]}
/>

<DocOrientation
  eyebrow="The archive path"
  title="Inspect the archive. Find a tile. Fetch only its bytes."
  description="PMTiles keeps a tile pyramid in one archive. The source adds loaders.gl source lifecycle and range scheduling around the format’s header, directory, and tile-content lookups."
  tone="violet"
  items={[
    {label: 'Open', value: 'Remote URL or in-memory PMTiles data'},
    {label: 'Discover', value: 'Header, metadata, and directory entries'},
    {label: 'Request', value: 'One tile or a coordinated batch of tiles'},
    {label: 'Transport', value: 'Merged HTTP ranges with bounded over-fetch'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
  <img src="https://img.shields.io/badge/range_requests-From_v5.0-blue.svg?style=flat-square" alt="range requests from v5.0" />
  <img src="https://img.shields.io/badge/range_requests-experimental-yellow.svg?style=flat-square" alt="range requests experimental" />
</p>

The `PMTilesSourceLoader` reads individual tiles from a PMTiles archive file.
For remote URL archives, tile requests are queued briefly and nearby HTTP byte ranges are
coalesced before the archive bytes are fetched.

| Loader         | Characteristic                                   |
| -------------- | ------------------------------------------------ |
| File Extension | `.pmtiles`                                       |
| File Type      | Binary Archive                                   |
| File Format    | [PMTiles](/docs/modules/pmtiles/formats/pmtiles) |
| Data Format    | Metadata                                         |

## Usage

<ReferenceBoundary
  title="Source and range details"
  description="The reference below covers construction, explicit tile batches, range scheduling options, diagnostics, and server response requirements."
  tone="violet"
/>

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';

const source = createDataSource(url, [PMTilesSourceLoader]);
const tile = await source.getTile(...);
```

### Batched tile reads

`getTile()` and `getTileData()` automatically participate in delayed range batching.
Requests made during the same `rangeRequests.batchDelayMs` window are started together;
tile-content byte ranges that are close together are fetched as one merged HTTP `Range`
request and then sliced back into per-tile results.

Applications that already know the complete tile set can also call the explicit batch API:

```typescript
const tilePromises = source.getTileDataBatch?.([tileA, tileB, tileC]);
```

See the [using range requests guide](../../../developer-guide/using-range-requests.md) for the
shared scheduler model and option tradeoffs.

Use `createRangeStats()` and `getRangeStats()` from `@loaders.gl/loader-utils` when you need
typed aggregate counters for PMTiles range transport diagnostics.

## Options

| Option                                | Type      | Default | Description                                                                 |
| ------------------------------------- | --------- | ------- | --------------------------------------------------------------------------- |
| `rangeRequests.batchDelayMs`       | `number`  | `50`    | Time to wait for sibling tile requests before starting PMTiles tile lookup.  |
| `rangeRequests.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby tile content. |
| `rangeRequests.maxGapBytes`        | `number`  | `65536` | Compatibility alias for `rangeExpansionBytes`.                              |
| `rangeRequests.maxMergedBytes`     | `number`  | `8388608` | Maximum size of one merged byte-range request.                             |
| `rangeRequests.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                     |
| `rangeRequests.stats`              | `Stats`   | none     | Optional probe.gl Stats object that receives range batching counters.       |
| `rangeRequests.onEvent`            | `function` | none    | Optional diagnostics callback for queued, batched, completed, failed, and aborted range requests. |

## Notes

- Blob / in-memory PMTiles archives are read directly and do not add the default network
  batching delay.
- PMTiles metadata, header, and directory handling is still delegated to the `pmtiles` package.
- PMTiles v2 archives may fall back to the package's normal single-tile lookup path.
- PMTiles URL sources expect byte-range fetches to return `206 Partial Content`. If a server
  ignores `Range` and responds with `200 OK`, loaders.gl aborts the fetch and rejects the tile
  request instead of downloading the full archive.
