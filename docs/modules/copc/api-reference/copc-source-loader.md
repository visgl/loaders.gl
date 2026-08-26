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
- `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively as the selected node range is fetched. `options.batchSize` controls the maximum points per table, `options.columns` selects the attributes listed below, and `options.signal` cancels the request/decode.
- `loadHierarchyInBatches(options)` yields hierarchy pages and their discovered nodes as they are fetched.

The source uses the native TypeScript COPC and LAZ readers for PDRF 6-8. `loadTileContentInBatches` splits the node range into requests and emits rows as soon as the requested independent layers arrive. PDRF 7 RGB waits for Point14 and RGB; PDRF 8 RGB/NIR waits for the layers requested through `options.columns`. `options.rangeChunkSize` controls request size, while `options.rangeConcurrency` can fetch later ranges ahead of in-order decoding.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `copc.sourceCoordinateSystem` | `string` | Auto-detected from COPC WKT | Coordinate system definition used when the source metadata does not include WKT. |
| `copc.rangeChunkSize` | `number` | `65536` | Default byte size for TypeScript COPC node range requests. |
| `copc.rangeConcurrency` | `number` | `1` | Maximum number of node ranges fetched ahead of decoding. Results are still decoded and yielded in range order. |

### Progressive Columns

`POSITION` is always present. PDRF 7/8 color remains enabled by default; all other attributes are opt-in through `options.columns`.

| Column request | Arrow output |
| --- | --- |
| `COLOR_0`, `NIR` | 16-bit RGB and PDRF 8 near-infrared channels. |
| `intensity`, `classification`, `GPS_TIME`, `scanAngle`, `userData`, `pointSourceId` | Standard LAS 1.4 scalar fields. |
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
