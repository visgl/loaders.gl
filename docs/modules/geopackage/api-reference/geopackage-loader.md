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

To load all tables in a GeoPackage file as GeoJSON:

```typescript
import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';
import {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';

const optionsAsTable: GeoPackageLoaderOptions = {
  geopackage: {
    shape: 'tables',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
  }
};
const tablesData: Tables<GeoJSONTable> = await load(url, GeoPackageLoader, optionsAsTable);
```

To load a specific table named `feature_table` in a GeoPackage file as GeoJSON:

```typescript
const optionsAsGeoJson: GeoPackageLoaderOptions = {
  geopackage: {
    shape: 'geojson-table',
    table: 'feature_table',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
  }
};

const geoJsonData: GeoJSONTable = await load(url, GeoPackageLoader, optionsAsGeoJson);
```

To load one vector table as Arrow instead of GeoJSON, use `geopackage.shape: 'arrow-table'`.

To inspect available tables first and then fetch a specific table, use [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source).

## Shapes

`GeoPackageLoader` returns all vector tables by default. Set `geopackage.shape` and optionally `geopackage.table` to select another representation.

| Shape              | Output                                      |
| ------------------ | ------------------------------------------- |
| `tables`           | loaders.gl `Tables<GeoJSONTable>` object    |
| `geojson-table`    | loaders.gl `GeoJSONTable` for one table     |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry   |

## Options

| Option                | Type   | Default                                             | Description                                                                                                            |
| --------------------- | ------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `geopackage.shape`    | String | `'tables'`                                          | Output shape: `'tables'`, `'geojson-table'`, or `'arrow-table'`.                                                       |
| `geopackage.table`    | String | N/A                                                 | Name of table to load for one-table output shapes.                                                                     |
| `geopackage.sqlJsCDN` | String | `'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackage loader is called on a file. |

## Output

The `GeoPackageLoader` currently loads GeoJSON features from GeoPackage vector tables.

- If `geopackage.shape` is `'tables'` (the default):

  Returns `Tables<ObjectRowTable>`, an object whose `.tables` member is an array of objects with `name` and `table` keys. Each `name` member holds the name of the GeoPackage table name, and each `.table` member holds a `Table` instance. The `Table.data` member is an array of GeoJSON features, while `Table.schema` describes the schema types of the original Sqlite3 table.

- If `geopackage.shape` is `'geojson-table'`:

  Returns a `GeoJSONTable` for the selected table.

- If `geopackage.shape` is `'arrow-table'`:

  Returns an `ArrowTable` for the selected table with a WKB `geometry` column.

## Remarks

- `options.geopackage.sqlJsCDN`: As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working.

## Notes

- GeoPackage does not define a standard preferred-table field. When a single table is not explicitly requested, loaders.gl uses best-effort metadata heuristics and otherwise falls back to the first vector table in `gpkg_contents`.
