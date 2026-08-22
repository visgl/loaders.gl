import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# GeoParquet

<ParquetDocsTabs active="geoparquet" />

![parquet-logo](../images/parquet-logo-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- _[`loaders.gl/parquet`](/docs/modules/parquet)_
- _[geoparquet.org](https://geoparquet.org)_

Geoparquet is a set of conventions for storing geospatial data in Parquet files.

Standardization is happening at [geoparquet.org](https://geoparquet.org).

GeoParquet file is a Parquet file that additionally follows these conventions:

- Geospatial metadata describing any geospatial columns is stored in the Parquet file's schema metadata (as stringified JSON).
- Geometry columns are [WKB](/docs/modules/wkt/formats/wkb) encoded or use GeoParquet single-geometry native encodings based on the GeoArrow specification.

## Supported features checklist

| Type                                                                                         | Supported |
| -------------------------------------------------------------------------------------------- | --------- |
| Parse file metadata                                                                          | ✅        |
| Geometry column encoding: WKB                                                                | ✅        |
| Geometry column encoding: single-geometry type encodings based on the GeoArrow specification | ✅ metadata pass-through and mapping |
| "crs" column metadata: transformt CRS to WGS84 with longitude, latitude representation.      | ❌        |
| "orientation" column metadata: reorder vertices if set "counterclockwise"                    | ❌        |
| GeoParquet 1.1 `covering.bbox`: per-row bounding boxes                                       | ✅ `ParquetSource.read({bbox})` |

## Metadata behavior in Arrow output

When a GeoParquet file is loaded as Arrow:

- the original GeoParquet `geo` JSON is preserved in `schema.metadata.geo`
- geometry fields receive GeoArrow field metadata when the encoding can be mapped safely
- geometry column buffers/layouts are passed through unchanged

GeoParquet-only metadata such as `primary_column`, `geometry_types`, `bbox`, and `covering`
remains in the schema-level `geo` metadata rather than being mirrored into field metadata.

## Spatial queries

GeoParquet 1.1 defined an optional `covering.bbox` object whose four values are two-level Parquet
schema paths such as `['bbox', 'xmin']`. `ParquetSourceLoader` validates that normative shape and
uses it for spatial row-group statistics, nested page-index pruning, and exact per-row bounding-box
intersection. The bbox struct is fetched as a hidden filter column when it is not projected.

GeoParquet 2.0 removes covering metadata in favor of Parquet's native `GEOMETRY` and `GEOGRAPHY`
logical types and geospatial statistics. GeoParquet 1.1 coverings remain important for current
datasets; native Parquet geospatial-statistics pruning is tracked separately.

## Alternatives

GeoParquet can be compared to GeoArrow, as both are binary columnar formats with a high degree of similarity.
