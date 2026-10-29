Geospatial columnar format

GeoParquet

# GeoParquet

GeoParquet adds geospatial metadata and encoding conventions to Parquet. The result is still a Parquet table, but readers can discover geometry columns, encodings, bounds, and coordinate meaning without a sidecar format.

[Parquet format](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[GeoArrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

⛶⛶ Explore fullscreen

GeoParquet[Try It](https://loaders.gl/next/examples/geospatial/geoparquet)[Overview](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Format](https://loaders.gl/next/docs/modules/tables/parquet/format.md)[GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[GeoParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/geoparquet-loader.md)[ParquetWriter](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

The GeoArrow boundary

## Geometry columns stay Arrow columns.

GeoArrow adds geometry layouts and extension metadata to an ordinary Arrow table. The geometry travels with typed attributes instead of taking a separate application path.

Geospatial inputs

[**GeoParquet**file-level metadata↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[**GeoJSON**features to columns↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[**WKB / WKT**geometry wire formats↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)

encod&#x65;**→**

◎

GeoArrow table

geometry · attributes · CRS metadata

reus&#x65;**→**

Shared table work

[**Scan**project and filter↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[**Render**geometry and attributes↗](https://loaders.gl/next/docs/specifications/category-gis.md)[**Write**Arrow IPC or GeoParquet↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

GeoArrow is a convention on top of Arrow, so the result stays compatible with Arrow IPC and the broader Arrow ecosystem.

The GeoParquet path

## One table, with spatial meaning attached.

GeoParquet keeps geometry values in typed Parquet columns and records how to interpret them in schema metadata. That makes storage, scan planning, and application conversion part of one inspectable path.

01

Storage

Parquet columns with GeoParquet metadata

02

Geometry

WKB, native GeoArrow, and newer logical encodings

03

Meaning

Primary geometry, bounds, CRS, and epoch metadata

04

Runtime

Projection, predicates, and Arrow feature tables

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`loaders.gl/parquet`](https://loaders.gl/next/docs/modules/tables/parquet.md)*
* *[geoparquet.org](https://geoparquet.org)*

GeoParquet is a standard for storing geospatial data in Parquet files.

Detailed guide

## GeoParquet metadata and encoding details

The sections below cover schema metadata, geometry encodings, supported features, CRS behavior, and loaders.gl integration.

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the cross-format CRS model and the distinction between metadata preservation and reprojection.

Standardization is happening at [geoparquet.org](https://geoparquet.org).

A GeoParquet file additionally follows these conventions:

* Geospatial metadata describing any geospatial columns is stored in the Parquet file's schema metadata (as stringified JSON).
* GeoParquet 2.0 geometry columns are root, non-repeated `BYTE_ARRAY` columns containing ISO WKB and annotated with Parquet's native `GEOMETRY` or `GEOGRAPHY` logical type.
* GeoParquet 1.x also permits single-geometry encodings based on the GeoArrow specification.

## Supported features checklist[​](#supported-features-checklist "Direct link to Supported features checklist")

| Feature                                                                           | Read                                                    | TypeScript write                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| GeoParquet `geo` metadata                                                         | ✅                                                      | ✅                                                |
| WKB geometry columns                                                              | ✅                                                      | ✅                                                |
| Parquet `GEOMETRY` and `GEOGRAPHY` logical types                                  | ✅                                                      | ✅ GeoParquet 2.x metadata selects the annotation |
| `SPHERICAL`, `VINCENTY`, `THOMAS`, `ANDOYER`, and `KARNEY` edges                  | ✅                                                      | ✅                                                |
| XY, XYZ, XYM, and XYZM geometry type codes                                        | ✅                                                      | ✅                                                |
| Native row-group bbox and geometry-type statistics                                | ✅                                                      | ✅                                                |
| GeoParquet 1.1 single-geometry encodings                                          | ✅ metadata/layout pass-through                         | ✅ metadata/layout pass-through                   |
| GeoParquet 1.1 `covering.bbox`                                                    | ✅ row-group, page, and exact-row filtering             | ✅ preserved when supplied                        |
| CRS metadata (`PROJJSON`, omitted default, explicit `null`, and coordinate epoch) | ✅ preserved                                            | ✅ preserved when supplied                        |
| CRS coordinate transformation                                                     | ❌ metadata preservation does not transform coordinates | ✕                                                 |
| Ring rewinding from `orientation`                                                 | ✕                                                       | ✕                                                 |

## Metadata behavior in Arrow output[​](#metadata-behavior-in-arrow-output "Direct link to Metadata behavior in Arrow output")

When a GeoParquet file is loaded as Arrow:

* the original GeoParquet `geo` JSON is preserved in `schema.metadata.geo`
* geometry fields receive GeoArrow field metadata when the encoding can be mapped safely
* geometry column buffers/layouts are passed through unchanged

GeoParquet-only metadata such as `primary_column`, `geometry_types`, `bbox`, and `covering` remains in the schema-level `geo` metadata rather than being mirrored into field metadata. An omitted GeoParquet CRS is mapped to GeoArrow's explicit `OGC:CRS84` authority identifier; GeoParquet `crs: null` remains unknown by omitting GeoArrow CRS metadata.

## Spatial queries[​](#spatial-queries "Direct link to Spatial queries")

GeoParquet 1.1 defined an optional `covering.bbox` object whose four values are two-level Parquet schema paths such as `['bbox', 'xmin']`. `ParquetSourceLoader` validates that normative shape and uses it for spatial row-group statistics, nested page-index pruning, and exact per-row bounding-box intersection. The bbox struct is fetched as a hidden filter column when it is not projected.

For GeoParquet 2.0, `ParquetSource.read({bbox})` first intersects the query with native column-chunk geospatial statistics and avoids fetching excluded row groups. Native GEOGRAPHY statistics and queries may cross the antimeridian. Native statistics are row-group candidate filters; unlike a 1.1 per-row covering, they do not claim exact geometry intersection.

The TypeScript writer computes native statistics directly from WKB without materializing GeoJSON. It skips non-finite values independently by dimension, omits Z or M bounds when absent, and emits the complete unique set of ISO WKB type codes found in each row group.

## Alternatives[​](#alternatives "Direct link to Alternatives")

GeoParquet is the persistent Parquet representation; GeoArrow defines in-memory Arrow extension layouts and metadata. loaders.gl preserves both layers and maps between their compatible semantics.
