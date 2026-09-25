---
title: ArrowTableTileSourceLoader
---

import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';

<TileDocsTabs active="arrow-table-tile-source-loader" />

# ArrowTableTileSourceLoader

`ArrowTableTileSourceLoader` generates clipped, simplified vector tiles from an in-memory Arrow
table. It is a separate alternative to [`TableTileSourceLoader`](./table-tile-source-loader):
input and output stay in Arrow, and attributes do not pass through GeoJSON objects.

```typescript
import {ArrowTableTileSourceLoaderWithParser} from '@loaders.gl/mvt/arrow-table-tile-source-loader';

// table is a loaders.gl ArrowTable or an Apache Arrow Table (or a promise of either).
const source = ArrowTableTileSourceLoaderWithParser.createDataSource(table, {
  table: {coordinates: 'wgs84'}
});
const tile = await source.getVectorTile({z: 5, x: 10, y: 12});
const geometry = tile?.data.getChild('geometry'); // GeoArrow WKB vector
```

## Loading a file

URLs and blobs work through async `load` with an explicit Arrow-producing loader. The source
does not select a parser or override its output options. Configure the parser to return Arrow.

```typescript
import {load} from '@loaders.gl/core';
import {GeoJSONLoader} from '@loaders.gl/json';
import {ArrowTableTileSourceLoader} from '@loaders.gl/mvt';

const source = await load('/features.geojson', ArrowTableTileSourceLoader, {
  core: {loaders: [GeoJSONLoader]}, // Arrow-primary in loaders.gl 5
  table: {coordinates: 'wgs84'}
});
const tile = await source.getTile({z: 0, x: 0, y: 0});
```

Source selection must be explicit: this source has no file extension or URL autodetection.
The package-root export is lightweight metadata: async `load` preloads its implementation.
Synchronous `createDataSource` calls require `ArrowTableTileSourceLoaderWithParser` from the explicit
`@loaders.gl/mvt/arrow-table-tile-source-loader` subpath. That subpath also exports the
`ArrowTableVectorTileSource` class. Direct construction requires an injected core API for URLs/blobs;
in-memory tables do not require `@loaders.gl/core`.

## Input and output

- Input geometry can be GeoArrow WKB, WKT, native concrete geometry columns, dense-union geometry,
  or native GeometryCollections. GeoParquet schema metadata can identify a WKB/WKT column without
  Arrow extension metadata. Box columns are not supported.
- Geometry selection uses `table.geometryColumn`, then GeoParquet's `primary_column`, then the
  sole GeoArrow extension field. Ambiguous or unsupported geometry columns are rejected.
- Input coordinates must be WGS84 longitude/latitude, in that order. Missing CRS metadata is
  accepted under this contract. CRS metadata, when supplied, must identify `EPSG:4326` or
  `OGC:CRS84` as an authority string or PROJJSON identifier. Reproject other CRSs before tiling.
- Tiling is two-dimensional and uses Web Mercator clipping/simplification. Z/M ordinates are
  discarded. Null geometries are omitted; GeometryCollections are expanded and repeat the
  corresponding attribute row. Polygon holes are retained.
- Every nonempty tile is a loaders.gl `ArrowTable` with the selected geometry column replaced by
  `geoarrow.wkb`. All other columns, including additional geometry columns, are selected unchanged
  from the source. Their types and field metadata are preserved, as is unrelated schema metadata.
- Attribute columns are zero-copy views of selected source-row runs. Treat input and returned
attribute buffers as immutable. Geometry buffers are newly allocated per request. Tiles may
  contain multiple record batches; consume the full Arrow table, not just its first batch.
- Output geometry metadata is refreshed: stale bounds/covering and input geometry types are not
  carried over. Local coordinates have an explicitly unknown CRS; geographic output uses CRS84.
- Output is an Arrow table, **not** encoded MVT or Arrow IPC bytes. Rendering integrations must
  support Arrow tile data. The complete input table and geometry index remain in memory; this is
  client-side tiling, not out-of-core querying or a worker-backed source.

The [interactive table tiler example](/examples/tiles/table-tiler) uses this source with
`SourceLayer` from `@loaders.gl/deck-layers`. That adapter converts Arrow tiles to deck.gl's binary
geometry representation at the rendering boundary, supporting both local and geographic output.

## Methods

The loader creates an `ArrowTableVectorTileSource` with these methods:

| Method | Result |
| --- | --- |
| `getVectorTile({x, y, z})` | `Promise<ArrowTable \| null>` |
| `getTile({x, y, z})` | Same as `getVectorTile` |
| `getTileData({index: {x, y, z}})` | Same Arrow result for rendering integrations |
| `getTileSync({x, y, z})` | `ArrowTable \| null`; first await `source.ready` |
| `getSchema()` | Promise of the output loaders.gl schema |
| `getMetadata()` | Promise of `{schema, minZoom: 0, maxZoom}` |

Empty or invalid tile requests, including zooms above `table.maxZoom`, return `null`.
Tile x coordinates wrap around the world;
geographic output uses the canonical wrapped tile. Repeated requests do not mutate the index.
`source.localCoordinates` reports the configured coordinate mode.

## Options

For shared loading controls and parser configuration, see
[Source options](/docs/developer-guide/using-sources#options). The settings below are specific to this source.

| Option | Default | Description |
| --- | --- | --- |
| `table.geometryColumn` | Auto-detected | Geometry field to index and clip |
| `table.coordinates` | `'local'` | Normalized tile-local XY, or `'wgs84'` / `'EPSG:4326'` longitude/latitude |
| `table.maxZoom` | `14` | Maximum supported tile zoom, retaining full geometry detail; integer 0–24 |
| `table.indexMaxZoom` | `5` | Maximum initial indexing zoom; integer 0–24, no greater than `maxZoom` |
| `table.maxPointsPerTile` | `10000` | Point budget before initial index subdivision |
| `table.tolerance` | `3` | Simplification tolerance in extent units |
| `table.extent` | `4096` | Positive tile extent used for quantization |
| `table.buffer` | `64` | Clipping buffer in extent units; local coordinates can extend beyond 0–1 |

Existing identifier columns remain Arrow columns. GeoJSON-specific `promoteId`, `generateId`,
`shape`, and `lineMetrics` options are not part of this source's API.

When setting `maxZoom` below 5, also lower `indexMaxZoom` to avoid exceeding the maximum tile zoom.
