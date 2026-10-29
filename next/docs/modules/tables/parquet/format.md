Columnar file format

![](/next/images/format-logos/parquet-logo.png)

# Apache Parquet

Parquet stores typed columns in independently addressable pages. loaders.gl combines its format reader with Arrow output, metadata-first sources, range requests, and GeoParquet conventions for cloud-friendly data access.

[Parquet overview](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[Selective reads](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md)

![](/next/images/format-logos/parquet-logo.png)[Try It](https://loaders.gl/next/examples/geospatial/geoparquet)[Overview](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Format](https://loaders.gl/next/docs/modules/tables/parquet/format.md)[GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[GeoParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/geoparquet-loader.md)[ParquetWriter](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

Cloud data path

## Metadata first, bytes second.

A Parquet application can inspect the footer and schema before reading all columns. That makes projection, predicate filtering, and spatial selection practical even when the file lives behind range requests.

01

Inspect

Read schema, footer, statistics, and GeoParquet metadata.

02

Select

Choose columns, row groups, pages, and optional predicates.

03

Decode

Return object rows or Arrow tables with typed columns.

04

Write

Encode compatible tables back to Parquet or GeoParquet.

Detailed guide

## Parquet module details

The reference below compares loaders, sources, writers, output shapes, streaming behavior, and the options that govern selective reads.

| Characteristic       | Value                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [Apache Parquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md), [GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md) |
| Data Format          | [Tables](https://loaders.gl/next/docs/specifications/category-table.md), [Geometry Tables](https://loaders.gl/next/docs/specifications/category-gis.md)                           |
| File Extension       | `.parquet`                                                                                                                                                                                  |
| MIME Type            | `application/octet-stream`                                                                                                                                                                  |
| File Type            | Binary                                                                                                                                                                                      |
| Loader APIs          | `load`, `parse`, `parseInBatches`                                                                                                                                                           |
| Loader Worker Thread | ❌ No                                                                                                                                                                                       |
| Loader Streaming     | ✅ Yes                                                                                                                                                                                      |
| Source APIs          | `createDataSource`, `getMetadata`, `getSchema`, `read`, `close`                                                                                                                             |
| Writer APIs          | `encode`, `encodeSync`                                                                                                                                                                      |

## Loaders, Sources and Writers[​](#loaders-sources-and-writers "Direct link to Loaders, Sources and Writers")

[Loader**ParquetLoader**Loads Parquet files as object-row tables or Arrow tables.Output: ObjectRowTable, ArrowTableAPIs: load, parse, parseInBatches](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader)[Loader**GeoParquetLoader**Loads GeoParquet files as GeoJSON tables or Arrow tables with geospatial metadata.Output: GeoJSONTable, ArrowTableAPIs: load, parse, parseInBatches](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/geoparquet-loader)[Source**ParquetSourceLoader**Reuses cached schema and footer metadata for selective Arrow reads.Output: ArrowTableBatchAPIs: createDataSource, getMetadata, getSchema, read](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader)[Writer**ParquetWriter**Writes loaders.gl tables as Parquet files.Input: TableAPIs: encode, encodeSync](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer)

## Encodings[​](#encodings "Direct link to Encodings")

Parquet stores data by column and groups values into row groups, column chunks, and pages. It supports per-column compression, repetition levels for nested data, and logical type annotations.

## GeoParquet[​](#geoparquet "Direct link to GeoParquet")

GeoParquet files are Parquet files with geospatial metadata in the schema and one or more geometry columns. See [GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md) for the geospatial conventions supported by loaders.gl.
