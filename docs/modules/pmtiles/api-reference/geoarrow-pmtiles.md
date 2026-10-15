---
title: GeoArrow to PMTiles
description: Tile an in-memory GeoArrow table and export selected MVT or MLT tiles in PMTiles v3.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="PMTiles module · authoring API"
  title="GeoArrow to vector tiles to PMTiles"
  description="Reuse the Arrow table tiler, encode selected tiles as MVT v2 or MLT v1, and download a bounded PMTiles archive."
  tone="violet"
  meta={['From v5.0', 'Columnar attributes', 'Browser and Node.js']}
  links={[
    {label: 'Arrow tiler', to: '/docs/modules/mvt/api-reference/arrow-table-tile-source-loader'},
    {label: 'MVT writer', to: '/docs/modules/mvt/api-reference/mvt-writer'},
    {label: 'PMTiles writer', to: '/docs/modules/pmtiles/api-reference/pmtiles-writer'}
  ]}
/>

`encodeGeoArrowPMTiles` accepts a loaders.gl `ArrowTable` or Apache Arrow `Table` and an explicit
finite selection of XYZ tile addresses. It uses the existing `ArrowTableVectorTileSource` for
indexing, clipping, simplification and geometry collection expansion. The tiler returns GeoArrow WKB
with normalized tile-local coordinates; `MVTWriter` or `MLTWriter` reads those geometries and scalar attributes
without converting attribute rows to GeoJSON feature objects. `encodePMTiles` packages the encoded bytes.

The implementation lives at `@loaders.gl/pmtiles/geoarrow`, keeping export orchestration outside the
package root's runtime imports.

## Usage

```typescript
import {encodeGeoArrowPMTiles} from '@loaders.gl/pmtiles/geoarrow';

// Input geometry is longitude/latitude WGS84. Here export only two selected tiles.
const archive = await encodeGeoArrowPMTiles(geoArrowTable, {
  tiles: [{z: 1, x: 0, y: 0}, {z: 1, x: 1, y: 1}],
  table: {maxZoom: 1, indexMaxZoom: 0, buffer: 64, tolerance: 3},
  mvt: {layerName: 'places', idColumn: 'id', propertyColumns: ['id', 'name']},
  pmtiles: {internalCompression: 'gzip', maxTiles: 100, maxOutputBytes: 16 * 1024 * 1024}
});

// Browser download; save the same ArrayBuffer through application file IO in Node.js.
const url = URL.createObjectURL(new Blob([archive], {type: 'application/vnd.pmtiles'}));
const link = document.createElement('a');
link.href = url;
link.download = 'places.pmtiles';
link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

For MLT v1 output, set `tileType: 'mlt'` and use `mlt` instead of `mvt`:

```typescript
const archive = await encodeGeoArrowPMTiles(geoArrowTable, {
  tileType: 'mlt',
  tiles: [{z: 0, x: 0, y: 0}],
  mlt: {layerName: 'places', idColumn: 'id', propertyColumns: ['name']}
});
```

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `tileType` | `'mvt'` | `'mvt'` or `'mlt'`; one format per archive. |
| `mlt` | Same layer/column defaults as `mvt` | MLT layer name, property columns, ID column and maxFeatures; used only for MLT output. |
| `tiles` | Required | Finite iterable or async iterable of `{z, x, y}`. Canonical north-origin XYZ addresses only. |
| `table` | Existing tiler defaults | Geometry column, maximum/index zoom, extent, buffer, tolerance and index point budget. Coordinates are forced to normalized tile-local output. |
| `mvt.layerName` | `'features'` | Single output layer name |
| `mvt.propertyColumns` | Non-geometry columns | Explicit scalar attribute projection; select supported columns when input includes richer data. |
| `mvt.idColumn` | None | Column supplying nonnegative exact JavaScript-safe integer feature IDs. No IDs are invented. |
| `mvt.maxFeatures` | `100000` | Maximum rows in each Arrow tile before MVT encoding |
| `maxInputRows` | `100000` | Input row limit checked before indexing |
| `pmtiles` | Writer defaults | Archive output/metadata budgets, bounds, center, auxiliary JSON metadata, internal compression and AbortSignal |

See [tiler options](/docs/modules/mvt/api-reference/arrow-table-tile-source-loader#options) and
[archive options](/docs/modules/pmtiles/api-reference/pmtiles-writer#options) for details.
When lowering `table.maxZoom` below 5, also lower `table.indexMaxZoom`.

The helper writes MVT v2 or MLT v1 with the tiler's extent (4096 by default), uncompressed tile payloads, and
PMTiles v3. Internal directory/metadata compression may be none or gzip. These format choices are
fixed for this authoring profile; the separate packaging API also supports already encoded raster tiles.

## Features and metadata

Input geometry uses the existing tiler's WKB, WKT and native GeoArrow/GeoParquet support, including
mixed geometry and collections. Input must follow its longitude/latitude CRS contract. The tiler
uses Web Mercator, retains polygon holes, and discards Z/M ordinates as documented by that API.

Both writers support the six 2D point, line and polygon families. Attributes support nullable
booleans, UTF-8 strings, finite numeric values, and dictionaries of supported scalars. Null tags are
omitted in MVT, which has no null property representation. MLT preserves nullable columns, with numeric attributes encoded as Float64 (including safe Arrow integers). Signed/unsigned Arrow integers must fit the
JavaScript safe integer range; values outside it fail explicitly. IDs must additionally be
nonnegative. Nested values, dates, binary attributes and other richer Arrow types require explicit
projection or preprocessing; they are never silently stringified by this path.

Output `vector_layers` is generated from the selected layer and scalar schema. Caller-supplied layer
metadata is replaced. Stale `bounds`, `minzoom`, `maxzoom`, `center`, `tiles` and `tilestats` summaries
are removed from auxiliary metadata; the archive header derives selected nonempty tile bounds/zooms,
or uses explicit `pmtiles.bounds` / `pmtiles.center`. Other JSON metadata is retained.

## Selection, budgets and cancellation

Each selected address is requested once. Empty or quantization-collapsed tiles are omitted. Duplicate
or invalid addresses fail, including addresses above the configured tiler zoom. An empty final
selection fails rather than producing an invalid empty directory. `pmtiles.maxTiles` limits **all
requested addresses**, including empty tiles, and also bounds the packaged tile count.

Input rows, per-tile rows and archive bytes have separate limits. These limits do not cap total
vertices or peak heap: the complete input table, geometry index, encoded payload snapshots and final
archive coexist in memory, with temporary decoding/compression allocations. This is bounded
in-memory authoring, not out-of-core ingestion or a streaming file sink.

Pass `pmtiles.signal` to cancel. Checks occur before indexing, around tile requests/encoding, and
inside packaging. Synchronous indexing and encoding cannot be interrupted mid-call. A producer
blocked in an async iterator must also observe the signal; the helper cannot interrupt its pending
`next()`. On failure or detected abort, iterators are closed and no partial archive is returned.

Broader CRS reprojection, general exact 64-bit MVT reader/writer qualification, scalable ingestion,
and raster authoring remain separate tranches.
