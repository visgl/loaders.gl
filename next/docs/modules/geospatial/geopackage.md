Geospatial database module

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage

# @loaders.gl/geospatial/geopackage

GeoPackage is a SQLite-based container for vector features, tiles, and metadata. The loader reads one selected table, while the source path handles discovery and multi-table access.

[GeoPackage format](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

⛶⛶ Explore fullscreen

Container discovery

## Open the package. Choose the layer. Read the table.

A GeoPackage can hold several feature tables in one SQLite file. Discovery keeps the container visible while the application selects one useful layer.

01

### GeoPackage file

SQLite container

tablesmetadata

the&#x6E;**→**

02

### Layer catalog

names · geometry · bounds

discoverinspect

the&#x6E;**→**

03

### Selected feature table

one layer for this task

choosefilter

the&#x6E;**→**

04

### Arrow feature table

geometry + typed attributes

reuserender

The package organizes the data; the application-facing table remains a focused, reusable result.

The GeoPackage path

## Load one table, or explore the container.

A GeoPackage can hold several tables and geometry layers. The loader resolves one selected table into the common Arrow path; the source exposes discovery and multi-table access.

01

Container

SQLite database with OGC-defined tables

02

Discovery

Layers, columns, geometry types, and metadata

03

Output

One Arrow feature table or GeoJSON table

04

Runtime

Local parsing with explicit CRS and layer information

Detailed guide

## GeoPackage module details

The sections below cover installation, loaders, sources, layers, tables, and attribution.

The `@loaders.gl/geospatial/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial sql.js
```

SQL.js is an optional peer dependency. Applications using the grouped package should install `@loaders.gl/geospatial sql.js`; other geospatial formats do not require SQL.js. The existing `geopackage.sqlJsCDN` option controls WASM asset resolution and does not replace the JavaScript peer dependency.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Source                                                                                                          | Description                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [`GeoPackageLoader`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md) | Loads one selected GeoPackage vector table.                                                        |
| [`GeoPackageSource`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md) | Discovers and queries feature tables, exposes tile grids, and reads bounded encoded tile payloads. |

## Reprojection[​](#reprojection "Direct link to Reprojection")

Reprojection uses the math.gl TypeScript projection engine. Legacy WKT1 Web Mercator definitions with a PROJ4 extension use the declared EPSG:3857 identifier. WKT2 definitions remain preferred when supplied. Unsupported projection operations raise an error.

## Attribution[​](#attribution "Direct link to Attribution")

The GeoPackage loaders and source use [SQL.js](https://sql.js.org/) under the MIT license.
