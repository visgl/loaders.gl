GeoPackage loader

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage

# GeoPackageLoader

GeoPackageLoader opens the SQLite container, discovers its feature tables, and returns the selected table in a loaders.gl geometry shape.

[GeoPackage format](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[GeoPackage module](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage[Try It](https://loaders.gl/next/examples/geospatial/geopackage)[Overview](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[Format](https://loaders.gl/next/docs/modules/geospatial/geopackage/format.md)[GeoPackageLoader](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)[GeoPackageSource](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md)

The read sequence

## Inspect the package before selecting rows.

A package can hold more than one feature table. Select the table and output shape explicitly; the loader keeps geometry columns and spatial metadata attached to the result.

01

Open

Load the SQLite-backed package

02

Discover

List tables and geometry metadata

03

Select

Choose one table and output shape

04

Return

GeoJSON, table, or feature data

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The `GeoPackageLoader` parses GeoPackage vector tables into loaders.gl geometry tables.

Detailed guide

## GeoPackage loader usage

The sections below cover package selection, output shapes, SQL.js setup, and the current loader constraints.

caution

The `GeoPackageLoader` requires applications to install the optional peer dependency `sql.js` (`npm install sql.js`). It uses the [`sql.js`](https://github.com/sql-js/sql.js) npm module which has caused issues with certain JavaScript bundlers. It is recommended that you do your own tests before using the `GeoPackageLoader` in your project.

## Installation[​](#installation "Direct link to Installation")

Install `sql.js` to use this API. It is an optional peer of `@loaders.gl/geospatial`.

```
npm install @loaders.gl/core @loaders.gl/geospatial sql.js@^1.14.1
```

For grouped imports, install `@loaders.gl/geospatial` in place of `@loaders.gl/geospatial/geopackage` and keep `sql.js` installed.

## Usage[​](#usage "Direct link to Usage")

The loader returns one selected vector table. With no table name supplied it uses the single table, the metadata-marked default, or the first vector table as a fallback:

```
import {GeoPackageLoader} from '@loaders.gl/geospatial/geopackage';

import {load} from '@loaders.gl/core';

import type {ArrowTable} from '@loaders.gl/core/schema';



const table: ArrowTable = await load(url, GeoPackageLoader);
```

To load a specific table named `feature_table` in a GeoPackage file as GeoJSON:

```
import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geospatial/geopackage';

import {load} from '@loaders.gl/core';

import type {GeoJSONTable} from '@loaders.gl/core/schema';



const optionsAsGeoJson: GeoPackageLoaderOptions = {

  geopackage: {

    shape: 'geojson-table',

    table: 'feature_table',

    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'

  }

};



const geoJsonData: GeoJSONTable = await load(url, GeoPackageLoader, optionsAsGeoJson);
```

The default output is an Arrow table. Use `geopackage.shape: 'geojson-table'` when a GeoJSON feature table is required.

To inspect available tables first and then fetch a specific table, use [`GeoPackageSource`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md).

## Shapes[​](#shapes "Direct link to Shapes")

`GeoPackageLoader` returns one selected vector table. Set `geopackage.shape` to choose the table representation and `geopackage.table` to select a table by name. To discover all tables and query them through a source API, use [`GeoPackageSource`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md).

| Shape           | Output                                    |
| --------------- | ----------------------------------------- |
| `geojson-table` | loaders.gl `GeoJSONTable` for one table   |
| `arrow-table`   | loaders.gl `ArrowTable` with WKB geometry |

## Options[​](#options "Direct link to Options")

| Option                | Type            | Default                                              | Description                                                                                                             |
| --------------------- | --------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `geopackage.shape`    | String          | `'arrow-table'`                                      | Output shape: `'arrow-table'` or `'geojson-table'`.                                                                     |
| `geopackage.table`    | String          | metadata-selected table                              | Name of the vector table to load.                                                                                       |
| `geopackage.sqlJsCDN` | String          | `'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackage loader is called on a file. |
| `gis.reproject`       | boolean         | `false`                                              | Opt-in coordinate transformation; missing source CRS or unsupported transformations throw `CRSReprojectionError`.       |
| `gis.targetCrs`       | `CRSDefinition` | `'WGS84'` when reprojection is enabled               | Output CRS for transformed coordinates.                                                                                 |

## Output[​](#output "Direct link to Output")

The `GeoPackageLoader` loads one GeoPackage vector table.

* If `geopackage.shape` is `'geojson-table'`:

  Returns a `GeoJSONTable` for the selected table.

* If `geopackage.shape` is `'arrow-table'`:

  Returns an `ArrowTable` for the selected table with a WKB `geometry` column.

Use [`GeoPackageSource`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md) when the application needs table discovery, metadata for multiple layers, or repeated table queries.

## Remarks[​](#remarks "Direct link to Remarks")

* `options.geopackage.sqlJsCDN`: As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working.

## Notes[​](#notes "Direct link to Notes")

* GeoPackage does not define a standard preferred-table field. When a single table is not explicitly requested, loaders.gl uses best-effort metadata heuristics and otherwise falls back to the first vector table in `gpkg_contents`.
