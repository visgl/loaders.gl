---
title: GeoPackageLoader
description: Read GeoPackage feature tables from a portable SQLite-based container.
hide_title: true
page_style: designed
---

import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="GeoPackage loader"
  title="GeoPackageLoader"
  description="GeoPackageLoader opens the SQLite container, discovers its feature tables, and returns the selected table in a loaders.gl geometry shape."
  tone="orange"
  logos={[{alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}]}
  meta={['SQLite-backed', 'Feature tables', 'Geometry metadata']}
  links={[
    {label: 'GeoPackage format', to: '/docs/modules/geopackage/formats/geopackage'},
    {label: 'GeoPackage module', to: '/docs/modules/geopackage'}
  ]}
/>

<DocLiveExample label="GeoPackage loader example" height="420px">
  <ClientExample kind="geospatial" format="GeoPackage" />
</DocLiveExample>

<GeoPackageDocsTabs active="loader" />

<DocOrientation
  eyebrow="The read sequence"
  title="Inspect the package before selecting rows."
  description="A package can hold more than one feature table. Select the table and output shape explicitly; the loader keeps geometry columns and spatial metadata attached to the result."
  tone="orange"
  items={[
    {label: 'Open', value: 'Load the SQLite-backed package'},
    {label: 'Discover', value: 'List tables and geometry metadata'},
    {label: 'Select', value: 'Choose one table and output shape'},
    {label: 'Return', value: 'GeoJSON, table, or feature data'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `GeoPackageLoader` parses GeoPackage vector tables into loaders.gl geometry tables.

<ReferenceBoundary
  title="GeoPackage loader usage"
  description="The sections below cover package selection, output shapes, SQL.js setup, and the current loader constraints."
  tone="orange"
/>

:::caution
The `GeoPackageLoader` depends on the [`sql.js`](https://github.com/sql-js/sql.js) npm module which has caused issues with certain JavaScript bundlers. It is recommended that you do your own tests before using the `GeoPackageLoader` in your project.
:::

## Usage

The loader returns one selected vector table. With no table name supplied it uses the
single table, the metadata-marked default, or the first vector table as a fallback:

```typescript
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';
import type {ArrowTable} from '@loaders.gl/schema';

const table: ArrowTable = await load(url, GeoPackageLoader);
```

To load a specific table named `feature_table` in a GeoPackage file as GeoJSON:

```typescript
import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';
import type {GeoJSONTable} from '@loaders.gl/schema';

const optionsAsGeoJson: GeoPackageLoaderOptions = {
  geopackage: {
    shape: 'geojson-table',
    table: 'feature_table',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
  }
};

const geoJsonData: GeoJSONTable = await load(url, GeoPackageLoader, optionsAsGeoJson);
```

The default output is an Arrow table. Use `geopackage.shape: 'geojson-table'` when a GeoJSON
feature table is required.

To inspect available tables first and then fetch a specific table, use [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source).

## Shapes

`GeoPackageLoader` returns one selected vector table. Set `geopackage.shape` to choose the
table representation and `geopackage.table` to select a table by name. To discover all tables
and query them through a source API, use [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source).

| Shape              | Output                                      |
| ------------------ | ------------------------------------------- |
| `geojson-table`    | loaders.gl `GeoJSONTable` for one table     |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry   |

## Options

| Option                | Type   | Default                                             | Description                                                                                                            |
| --------------------- | ------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `geopackage.shape`    | String | `'arrow-table'`                                     | Output shape: `'arrow-table'` or `'geojson-table'`.                                                                     |
| `geopackage.table`    | String | metadata-selected table                             | Name of the vector table to load.                                                                                      |
| `geopackage.sqlJsCDN` | String | `'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackage loader is called on a file. |

## Output

The `GeoPackageLoader` loads one GeoPackage vector table.

- If `geopackage.shape` is `'geojson-table'`:

  Returns a `GeoJSONTable` for the selected table.

- If `geopackage.shape` is `'arrow-table'`:

  Returns an `ArrowTable` for the selected table with a WKB `geometry` column.

Use [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source) when the
application needs table discovery, metadata for multiple layers, or repeated table queries.

## Remarks

- `options.geopackage.sqlJsCDN`: As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working.

## Notes

- GeoPackage does not define a standard preferred-table field. When a single table is not explicitly requested, loaders.gl uses best-effort metadata heuristics and otherwise falls back to the first vector table in `gpkg_contents`.
