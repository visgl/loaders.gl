---
title: COPCSourceLoader
description: Build a range-readable point-cloud source from a COPC dataset.
hide_title: true
page_style: designed
---

import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';
import {CopcRangeGraphic} from '@site/src/components/docs/copc-range-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="COPC source"
  title="Turn one cloud object into a selectable point source."
  description="COPCSourceLoader connects the COPC hierarchy to loaders.gl's point-cloud source contract. It discovers metadata, selects nodes, range-reads LAZ chunks, and can emit normalized point tiles or Arrow batches."
  tone="violet"
  meta={['COPC 1.0', 'Range requests', 'PointCloudTileset']}
  links={[
    {label: 'COPC format', to: '/docs/modules/copc/formats/copc'},
    {label: 'Potree source', to: '/docs/modules/potree/api-reference/potree-source-loader'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

<CopcDocsTabs active="source" />

<CopcRangeGraphic />

<DocOrientation
  eyebrow="What this loader does"
  title="Discover, select, fetch, emit."
  description="The source keeps hierarchy and point decoding separate, so viewport traversal or a scan query can stop before unrelated nodes are fetched."
  tone="violet"
  items={[
    {label: 'Discover', value: 'Bounds, CRS, schema, hierarchy, and point count'},
    {label: 'Select', value: 'Nodes by bounds, level, spacing, or query'},
    {label: 'Fetch', value: 'COPC hierarchy and LAZ payload ranges'},
    {label: 'Emit', value: 'Point tiles or progressive Arrow point batches'}
  ]}
/>

`COPCSourceLoader` creates a point-cloud tile source for Cloud Optimized Point Cloud (`.copc.laz`) datasets.

<ReferenceBoundary
  title="Source construction and loading"
  description="The sections below document source creation, tile methods, column selection, batching, cancellation, and range scheduling."
  tone="violet"
/>

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
- `loadTileContent(tile, options)` returns normalized point positions, optional colors, point count, and cartographic origin. `options.signal` cancels queued work, the active range request, or worker decode.
- `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively as the selected node range is fetched. `options.batchSize` controls the maximum points per table, `options.columns` selects the attributes listed below, and `options.signal` cancels the request/decode.
- `loadHierarchyInBatches(options)` yields hierarchy pages and their discovered nodes as they are fetched.

The source uses the native TypeScript COPC and LAZ readers for PDRF 6-8. Atomic `loadTileContent` calls created through `@loaders.gl/core` use the package's single prebuilt TypeScript LAS worker pool when workers are enabled; direct source construction and unavailable workers fall back to main-thread decoding. `copc.decodeConcurrency` bounds each source's combined node fetch and decode work to control peak compressed and decoded memory.

`loadTileContentInBatches` remains on the calling thread because its async iterator is the streaming boundary. It splits the node range into requests and emits rows as soon as the requested independent layers arrive. PDRF 7 RGB waits for Point14 and RGB; PDRF 8 RGB/NIR waits for the layers requested through `options.columns`. `options.rangeChunkSize` controls request size, while `options.rangeConcurrency` can fetch later ranges ahead of in-order decoding.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.sourceCoordinateSystem` | `string` | Auto-detected from COPC WKT | Coordinate system definition used when the source metadata does not include WKT. |
| `copc.rangeChunkSize` | `number` | `65536` | Default byte size for TypeScript COPC node range requests. |
| `copc.rangeConcurrency` | `number` | `1` | Maximum number of node ranges fetched ahead of decoding. Results are still decoded and yielded in range order. |
| `copc.decodeConcurrency` | `number` | `core.maxConcurrency` or `3` | Maximum number of complete atomic node fetches and worker decodes active for one source. |

### Progressive Columns

`POSITION` is always present. PDRF 7/8 color remains enabled by default; all other attributes are opt-in through `options.columns`.

| Column request | Arrow output |
| --- | --- |
| `COLOR_0`, `NIR` | 16-bit RGB and PDRF 8 near-infrared channels. |
| `intensity`, `classification`, `GPS_TIME`, `scanAngle`, `userData`, `pointSourceId` | Standard LAS 1.4 scalar fields. |
| `synthetic`, `keyPoint`, `withheld`, `overlap` | LAS 1.4 classification flags as 0/1 byte columns. |
| `returnNumber`, `numberOfReturns`, `scannerChannel` | Pulse-return and scanner metadata. |
| `scanDirectionFlag`, `edgeOfFlightLine` | Flight-line flags as 0/1 byte columns. |
| `EXTRA_BYTES` | One named typed `EXTRA_BYTES_*` Arrow attribute per VLR descriptor, including vector size and scale/offset transforms. |

## Low-Level Range APIs

The package exports the native parsing primitives used by `COPCSourceLoader`:

| API | Description |
| --- | --- |
| `openCOPC(readRange)` | Reads and validates the LAS 1.4 header, VLR/EVLR descriptors, COPC info VLR, WKT, and Extra Bytes metadata. |
| `loadCOPCHierarchyPage(readRange, page)` | Fetches and parses one hierarchy page. |
| `loadCOPCNodeData(readRange, node)` | Fetches one exact compressed node range. |
| `parseCOPCHeader(bytes)` | Parses and validates a 375-byte COPC LAS header. |
| `parseCOPCInfo(bytes)` | Parses a 160-byte COPC info payload. |
| `parseCOPCHierarchy(bytes)` | Parses native 32-byte hierarchy entries. |

`readRange(begin, end, signal)` returns exactly the requested half-open range as a `Uint8Array`. Offsets and lengths must remain within JavaScript's safe integer range.
