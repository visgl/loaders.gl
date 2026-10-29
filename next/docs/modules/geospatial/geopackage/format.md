Geospatial container

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage

# A portable SQLite file for geospatial tables.

GeoPackage combines OGC-defined metadata tables with SQLite storage for vector features, tiles, and related geospatial content. loaders.gl exposes the tables through common geometry and Arrow paths.

[GeoPackage module](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)[GeoPackageLoader](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)[Source API](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md)

![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage[Try It](https://loaders.gl/next/examples/geospatial/geopackage)[Overview](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[Format](https://loaders.gl/next/docs/modules/geospatial/geopackage/format.md)[GeoPackageLoader](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)[GeoPackageSource](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source.md)

Portable geospatial data

## Open the table you need, keep its metadata.

A GeoPackage can contain several feature tables and the metadata that describes their geometry columns and coordinate systems. The loader turns a selected table into a shared application shape.

01

Container

A single SQLite file with OGC metadata tables.

02

Discovery

Inspect tables, geometry columns, bounds, and CRS metadata.

03

Output

GeoJSON tables, WKB-backed geometry, or Arrow tables.

04

Source path

Read selected table data without treating the whole file as one row set.

Detailed guide

## GeoPackage format and API details

The reference below describes the SQLite container, OGC metadata, supported geometry encodings, and the loader/source boundaries.

| Characteristic       | Value                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| File Format          | [GeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) |
| Data Format          | [Geometry Tables](https://loaders.gl/next/docs/specifications/category-gis.md), Arrow tables   |
| File Extension       | `.gpkg`                                                                                             |
| MIME Type            | `application/geopackage+sqlite3`                                                                    |
| File Type            | Binary SQLite database                                                                              |
| Loader APIs          | `load`, `parse`                                                                                     |
| Loader Worker Thread | ❌ No                                                                                               |
| Loader Streaming     | ❌ No                                                                                               |
| Source APIs          | `createDataSource`, `getMetadata`, `getTable`                                                       |

## Loaders and Sources[​](#loaders-and-sources "Direct link to Loaders and Sources")

[Loader**GeoPackageLoader**Loads one selected GeoPackage vector table.Output: GeoJSONTable, ArrowTableAPIs: load, parse](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader)[Source**GeoPackageSource**Exposes GeoPackage table metadata and one-table Arrow reads.Output: ArrowTableAPIs: createDataSource, getMetadata, getTable](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-source)

## SQLite Container[​](#sqlite-container "Direct link to SQLite Container")

GeoPackage stores geospatial data in a SQLite database with OGC-defined metadata tables. loaders.gl reads vector feature tables and converts geometries into GeoJSON or WKB-backed Arrow output.

## Arrow[​](#arrow "Direct link to Arrow")

Set `geopackage.shape: 'arrow-table'` and specify `geopackage.table` to load one vector table as an Arrow table with a WKB `geometry` column.
