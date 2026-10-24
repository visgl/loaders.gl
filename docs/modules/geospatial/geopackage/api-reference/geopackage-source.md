---
title: GeoPackageSource
description: Discover GeoPackage tables and read selected data as Arrow.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';

<DocPageHeader
  format="geopackage"
  eyebrow="GeoPackage source"
  title="GeoPackageSource"
  description="`GeoPackageSource` exposes GeoPackage table metadata and reads a selected table into the common Arrow table shape. It keeps database discovery separate from the application’s table-processing path."
  tone="yellow"
  meta={['GeoPackage', 'Table discovery', 'Arrow output']}
  links={[
    {label: 'GeoPackage module', to: '/docs/modules/geospatial/geopackage'},
    {label: 'GeoPackage format', to: '/docs/modules/geospatial/geopackage/formats/geopackage'},
    {label: 'Arrow data plane', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The database-file path"
  title="Discover tables first. Read the one you need."
  description="The source opens the GeoPackage, reports available vector tables and geometry metadata, and applies the same default-table behavior as the loader when a table is selected."
  tone="yellow"
  items={[
    {label: 'Open', value: 'GeoPackage URL or supported loaded data'},
    {label: 'Discover', value: 'Tables, geometry columns, and default selection'},
    {label: 'Read', value: 'One selected table with loader options'},
    {label: 'Output', value: 'ArrowTable with GeoPackage metadata'}
  ]}
/>

<GeoPackageDocsTabs active="source" />

<ReferenceBoundary
  title="Source contract"
  description="The short reference below covers construction, metadata discovery, table selection, and output shape."
  tone="yellow"
/>

`GeoPackageSource` is available from `@loaders.gl/geospatial/geopackage`. It is a GeoPackage-specific source that exposes table metadata and one-table Arrow loads.

```typescript
import {createDataSource} from '@loaders.gl/core';
import {GeoPackageSource} from '@loaders.gl/geospatial/geopackage';

const dataSource = createDataSource(url, [GeoPackageSource], {geopackage: {}});
const metadata = await dataSource.getMetadata();
const table = await dataSource.getTable(metadata.tables[0]?.name);
```

`getMetadata()` returns available vector tables, including geometry column metadata and the selected default table.

`getTable(tableName?)` returns the selected table as an `ArrowTable` using the same default-table heuristic as `GeoPackageLoader` with `geopackage.shape: 'arrow-table'`.

## Raster tile-table metadata

`getMetadata()` also returns `tileTables`, independently of vector `tables`. Raster-only packages return an empty vector list and do not require `gpkg_geometry_columns`. Feature-table reads and queries retain their existing behavior.

Each tile-table entry has `name`, optional `identifier` and `description`, local `srsId`, an authority-qualified `crs` when declared, matrix-set `bounds`, and `tileGrid`. A local SRS key is not assumed to be an EPSG code. Unknown authority identifiers leave the grid partial.

The grid uses `gpkg_tile_matrix_set` for its upper-left origin and extent, and `gpkg_tile_matrix` for level identifiers, matrix dimensions, tile sizes, and pixel sizes. Horizontal pixel size becomes `resolution`; vertical size becomes `resolutionY`. Complete levels expose math.gl geometry. Invalid dimensions, pixel sizes, bounds, duplicate levels, or inconsistent SRS references are rejected. At every level, matrix dimensions multiplied by tile dimensions and pixel sizes must match the declared matrix-set extent; only floating-point roundoff is tolerated.

| Capability | Support |
| --- | --- |
| Tile-table discovery and normalized grids | Supported |
| Independent horizontal/vertical pixel sizes | Supported |
| Raster-only and mixed packages | Supported |
| Encoded tile payload reads | Supported through `getTile()`; decoding is application controlled |
| Sparse point lookup | Missing rows return `null`; metadata does not scan tile rows |

`bounds` describes the matrix set, not a derived extent from stored tile rows or vector content. Tile-table metadata does not imply every tile position is populated. See [Tile matrices and tile matrix sets](/docs/developer-guide/tile-matrices) and the [GeoPackage tile matrix specification](https://www.geopackage.org/spec/#tile_matrix).

## Encoded tile payloads

Call `getTile(tableName, parameters, {maxBytes?})` with an explicit tile-table name. It returns an owned `ArrayBuffer` containing the stored PNG, JPEG, or other encoded bytes, or `null` for a missing row or an out-of-grid integer position. The vector default-table option does not select a tile table.

`parameters` contains `z`, `x` (column), `y` (top-down row), optional `tileMatrix`, and optional `signal`. An explicit matrix ID is matched exactly. Otherwise `z` first matches a native zoom ID and then a level index. Unknown levels and noninteger coordinates throw.

`maxBytes` defaults to 16 MiB and must be a nonnegative safe integer. Oversized or non-BLOB payloads throw. SQLite checks the encoded length before returning the BLOB. Each read opens and closes a database over cached file bytes; this API loads the whole package and does not provide HTTP range access to SQLite. Cancellation is checked before initialization and before the synchronous lookup; it does not interrupt shared metadata/file loading or a running SQLite statement.

```typescript
const tileTable = metadata.tileTables[0];
const bytes = await dataSource.getTile(
  tileTable.name,
  {z: 0, tileMatrix: tileTable.tileGrid.matrixIds![0], x: 0, y: 0},
  {maxBytes: 8 * 1024 * 1024}
);
// null means this position has no stored tile. Decode non-null bytes as needed.
```
