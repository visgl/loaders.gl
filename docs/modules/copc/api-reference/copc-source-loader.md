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
- `loadTileContent(tile, options)` returns normalized point positions, optional colors, point count, and cartographic origin. `options.signal` cancels queued work, the active range request, or worker decode.
- `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively as the selected node range is fetched. `options.batchSize` controls the maximum points per table, `options.limit` caps rows for the node, `options.bounds` applies exact source-coordinate filtering, `options.columns` selects the attributes listed below, and `options.signal` cancels the request/decode.
- `loadHierarchyInBatches(options)` yields hierarchy pages and their discovered nodes as they are fetched.

## Query metadata and scans

`getQueryMetadata()` describes the schema and pushdown capabilities of the point-cloud scan API.
Its field names are the same names accepted by `scan({columns})`, so a query panel can use the
returned schema directly. `POSITION` is a three-component point column and `COLOR_0` is a
three-component 16-bit RGB column. The remaining fields are scalar LAS attributes; `EXTRA_BYTES`
is a logical selector that enables the descriptor-defined typed `EXTRA_BYTES_*` attributes.

```typescript
const metadata = await dataSource.getQueryMetadata();
const columns = metadata.schema.fields
  .filter(field => field.name !== 'POSITION')
  .map(field => field.name);

for await (const batch of dataSource.scan({
  columns: ['POSITION', 'intensity', 'classification'],
  bounds: {
    minimum: [xmin, ymin, zmin],
    maximum: [xmax, ymax, zmax]
  },
  minimumLevel: 2,
  maximumLevel: 8,
  targetSpacing: 0.25,
  batchSize: 65536,
  limit: 100000
})) {
  consume(batch.data);
}
```

`bounds` first prunes wholly disjoint hierarchy nodes and then applies an exact inclusive test to
decoded point positions. `minimumLevel`, `maximumLevel`, and `targetSpacing` select the hierarchy
levels that may contribute samples; target spacing includes coarser ancestor samples through the
selected level. `batchSize` remains the maximum number of rows in each emitted batch, including
when `limit` is set. `limit` stops after exactly that many in-bounds points, and `signal` cancels
hierarchy reads, range requests, and decoding.

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
