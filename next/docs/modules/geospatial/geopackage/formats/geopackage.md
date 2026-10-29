Portable geospatial package

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage

# GeoPackage

GeoPackage uses SQLite to package geospatial tables and metadata in one portable file. loaders.gl can discover a feature table and expose it through the common table shape.

[GeoPackage module](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage[Try It](https://loaders.gl/next/examples/geospatial/geopackage)[Overview](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[Format](https://loaders.gl/next/docs/modules/geospatial/geopackage/format.md)[GeoPackageLoader](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)[GeoPackageSource](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md)

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

The package boundary

## Discover the table before reading the rows.

A GeoPackage may contain several feature tables. The source first discovers the package catalog, then reads the selected table into a consistent Arrow feature shape.

01

Container

SQLite database in one file

02

Catalog

Feature tables, geometry columns, and bounds

03

Output

Arrow feature table with geometry metadata

04

Execution

Materialized read with residual filtering

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

The `@loaders.gl/geospatial/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

## Scan support[​](#scan-support "Direct link to Scan support")

`GeoPackageLoader` reads one selected feature table as an Arrow table by default. `GeoPackageSource` discovers the feature tables in a package and exposes one selected table as an Arrow feature table. The source path favors portability and correctness over SQLite query pushdown.

| Capability                       | Support            | Execution                                     |
| -------------------------------- | ------------------ | --------------------------------------------- |
| Entry point                      | ✅ `read()`        | One materialized Arrow batch                  |
| Table and schema discovery       | ✅ Supported       | GeoPackage catalog and selected feature table |
| Geometry role and source bounds  | ✅ Supported       | Exposed through scan metadata                 |
| Attribute predicate              | ✅ Supported       | Residual after decoding                       |
| Projection and global limit      | ✅ Supported       | Residual                                      |
| Streaming and cancellation       | ❌ Not advertised  | The selected table is materialized            |
| SQLite or spatial-index pushdown | ❌ Not implemented | No pushdown claim is made                     |

Choose the feature table through the source options before calling `getQueryMetadata()` or `read()`. Predicate columns remain available for filtering even when they are absent from the final projection.

Detailed guide

## GeoPackage structure and execution

The sections below cover package metadata, feature-table selection, geometry handling, and the current scan execution boundary.
