COPC source

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)

# COPCSourceLoader

Turn one cloud object into a selectable point source. Discover metadata, select nodes, range-read LAZ chunks, and emit normalized point tiles or Arrow batches.

[COPC format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[Potree source](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)[Try It](https://loaders.gl/next/examples/pointclouds/copc-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[COPCSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)[COPCWriter](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)

The cloud point path

## Let the hierarchy choose the ranges.

COPC puts an octree directory beside the point data. A viewport or bounded query can use that directory first, then fetch only the compressed nodes that can contribute results.

one .copc.laz objectCOPC 1.0

**LAS header**scale · bounds · CRS

**COPC info VLR**root cube · spacing

**hierarchy pages**node → byte range

**LAZ point chunks**selected nodes only

→HTTP ranges

bounded request

⌖bounds + level of detail

\#columns + limit

↯cancel when enough arrives

→decode selected nodes

[application result](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

[**Arrow point batches**positions · color · attributes ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The same source can serve progressive viewport tiles or a bounded scan without changing the underlying point representation.

What this loader does

## Discover, select, fetch, emit.

The source keeps hierarchy and point decoding separate, so viewport traversal or a scan query can stop before unrelated nodes are fetched.

01

Discover

Bounds, CRS, schema, hierarchy, and point count

02

Select

Nodes by bounds, level, spacing, or query

03

Fetch

COPC hierarchy and LAZ payload ranges

04

Emit

Point tiles or progressive Arrow point batches

`COPCSourceLoader` creates a point-cloud tile source for Cloud Optimized Point Cloud (`.copc.laz`) datasets.

Detailed guide

## Source construction and loading

The sections below document source creation, tile methods, column selection, batching, cancellation, and range scheduling.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {COPCSourceLoader} from '@loaders.gl/tiles-3d/copc';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';



const dataSource = createDataSource(url, [COPCSourceLoader], {

  copc: {}

});



const tileset = new PointCloudTileset(dataSource);

await tileset.selectTiles(viewport);
```

## Data Source[​](#data-source "Direct link to Data Source")

The created data source exposes the point-cloud tile methods used by `PointCloudTileset`:

* `getMetadata()` returns COPC metadata, inferred bounds, and an initial view state.
* `getRootTile()` returns the root octree tile header.
* `getChildren(tile)` returns available child tile headers.
* `loadTileContent(tile, options)` returns normalized point positions, optional colors, point count, and cartographic origin. `options.signal` cancels queued work, the active range request, or worker decode.
* `loadTileContentInBatches(tile, options)` yields normalized Arrow point tables progressively as the selected node range is fetched. `options.batchSize` controls the maximum points per table, `options.columns` selects the attributes listed below, and `options.signal` cancels the request/decode.
* `loadHierarchyInBatches(options)` yields hierarchy pages and their discovered nodes as they are fetched.
* `close()` invalidates cached and physical reads, cancels pending range and atomic node work, and closes the underlying file once. Subsequent node loads reject, including Blob-backed sources.

The source uses the native TypeScript COPC and LAZ readers for PDRF 6-8. Atomic `loadTileContent` calls created through `@loaders.gl/core` use the package's single prebuilt TypeScript LAS worker pool when workers are enabled; direct source construction and unavailable workers fall back to main-thread decoding. `copc.decodeConcurrency` bounds each source's combined node fetch and decode work to control peak compressed and decoded memory.

`loadTileContentInBatches` remains on the calling thread because its async iterator is the streaming boundary. It splits the node range into requests and emits rows as soon as the requested independent layers arrive. PDRF 7 RGB waits for Point14 and RGB; PDRF 8 RGB/NIR waits for the layers requested through `options.columns`. `options.rangeChunkSize` controls request size, while `options.rangeConcurrency` can fetch later ranges ahead of in-order decoding.

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

| Option                        | Type     | Default                      | Description                                                                                                    |
| ----------------------------- | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `copc.sourceCoordinateSystem` | `string` | Auto-detected from COPC WKT  | Coordinate system definition used when the source metadata does not include WKT.                               |
| `copc.rangeChunkSize`         | `number` | `65536`                      | Default byte size for TypeScript COPC node range requests.                                                     |
| `copc.rangeConcurrency`       | `number` | `1`                          | Maximum number of node ranges fetched ahead of decoding. Results are still decoded and yielded in range order. |
| `copc.decodeConcurrency`      | `number` | `core.maxConcurrency` or `3` | Maximum number of complete atomic node fetches and worker decodes active for one source.                       |

### Progressive Columns[​](#progressive-columns "Direct link to Progressive Columns")

`POSITION` is always present. PDRF 7/8 color remains enabled by default; all other attributes are opt-in through `options.columns`.

| Column request                                                                      | Arrow output                                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `COLOR_0`, `NIR`                                                                    | 16-bit RGB and PDRF 8 near-infrared channels.                                                                          |
| `intensity`, `classification`, `GPS_TIME`, `scanAngle`, `userData`, `pointSourceId` | Standard LAS 1.4 scalar fields.                                                                                        |
| `synthetic`, `keyPoint`, `withheld`, `overlap`                                      | LAS 1.4 classification flags as 0/1 byte columns.                                                                      |
| `returnNumber`, `numberOfReturns`, `scannerChannel`                                 | Pulse-return and scanner metadata.                                                                                     |
| `scanDirectionFlag`, `edgeOfFlightLine`                                             | Flight-line flags as 0/1 byte columns.                                                                                 |
| `EXTRA_BYTES`                                                                       | One named typed `EXTRA_BYTES_*` Arrow attribute per VLR descriptor, including vector size and scale/offset transforms. |

## Low-Level Range APIs[​](#low-level-range-apis "Direct link to Low-Level Range APIs")

The package exports the native parsing primitives used by `COPCSourceLoader`:

| API                                      | Description                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `openCOPC(readRange)`                    | Reads and validates the LAS 1.4 header, VLR/EVLR descriptors, COPC info VLR, WKT, and Extra Bytes metadata. |
| `loadCOPCHierarchyPage(readRange, page)` | Fetches and parses one hierarchy page.                                                                      |
| `loadCOPCNodeData(readRange, node)`      | Fetches one exact compressed node range.                                                                    |
| `parseCOPCHeader(bytes)`                 | Parses and validates a 375-byte COPC LAS header.                                                            |
| `parseCOPCInfo(bytes)`                   | Parses a 160-byte COPC info payload.                                                                        |
| `parseCOPCHierarchy(bytes)`              | Parses native 32-byte hierarchy entries.                                                                    |

`readRange(begin, end, signal)` returns exactly the requested half-open range as a `Uint8Array`. Offsets and lengths must remain within JavaScript's safe integer range.
