import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# GeoParquet

<ParquetDocsTabs active="geoparquet" />

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

![parquet-logo](../images/parquet-logo-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- _[`loaders.gl/parquet`](/docs/modules/parquet)_
- _[geoparquet.org](https://geoparquet.org)_

GeoParquet is a standard for storing geospatial data in Parquet files.

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
cross-format CRS model and the distinction between metadata preservation and reprojection.

Standardization is happening at [geoparquet.org](https://geoparquet.org).

A GeoParquet file additionally follows these conventions:

- Geospatial metadata describing any geospatial columns is stored in the Parquet file's schema metadata (as stringified JSON).
- GeoParquet 2.0 geometry columns are root, non-repeated `BYTE_ARRAY` columns containing ISO WKB and annotated with Parquet's native `GEOMETRY` or `GEOGRAPHY` logical type.
- GeoParquet 1.x also permits single-geometry encodings based on the GeoArrow specification.

## Supported features checklist

| Feature | Read | TypeScript write |
| --- | --- | --- |
| GeoParquet `geo` metadata | ✅ | ✅ |
| WKB geometry columns | ✅ | ✅ |
| Parquet `GEOMETRY` and `GEOGRAPHY` logical types | ✅ | ✅ GeoParquet 2.x metadata selects the annotation |
| `SPHERICAL`, `VINCENTY`, `THOMAS`, `ANDOYER`, and `KARNEY` edges | ✅ | ✅ |
| XY, XYZ, XYM, and XYZM geometry type codes | ✅ | ✅ |
| Native row-group bbox and geometry-type statistics | ✅ | ✅ |
| GeoParquet 1.1 single-geometry encodings | ✅ metadata/layout pass-through | ✅ metadata/layout pass-through |
| GeoParquet 1.1 `covering.bbox` | ✅ row-group, page, and exact-row filtering | preserved when supplied |
| CRS metadata (`PROJJSON`, omitted default, explicit `null`, and coordinate epoch) | ✅ preserved | ✅ preserved when supplied |
| CRS coordinate transformation | ❌ metadata preservation does not transform coordinates | ❌ |
| Ring rewinding from `orientation` | ❌ | ❌ |

## Metadata behavior in Arrow output

When a GeoParquet file is loaded as Arrow:

- the original GeoParquet `geo` JSON is preserved in `schema.metadata.geo`
- geometry fields receive GeoArrow field metadata when the encoding can be mapped safely
- geometry column buffers/layouts are passed through unchanged

GeoParquet-only metadata such as `primary_column`, `geometry_types`, `bbox`, and `covering`
remains in the schema-level `geo` metadata rather than being mirrored into field metadata.
An omitted GeoParquet CRS is mapped to GeoArrow's explicit `OGC:CRS84` authority identifier;
GeoParquet `crs: null` remains unknown by omitting GeoArrow CRS metadata.

## Spatial queries

GeoParquet 1.1 defined an optional `covering.bbox` object whose four values are two-level Parquet
schema paths such as `['bbox', 'xmin']`. `ParquetSourceLoader` validates that normative shape and
uses it for spatial row-group statistics, nested page-index pruning, and exact per-row bounding-box
intersection. The bbox struct is fetched as a hidden filter column when it is not projected.

For GeoParquet 2.0, `ParquetSource.read({bbox})` first intersects the query with native
column-chunk geospatial statistics and avoids fetching excluded row groups. Native GEOGRAPHY
statistics and queries may cross the antimeridian. Native statistics are row-group candidate
filters; unlike a 1.1 per-row covering, they do not claim exact geometry intersection.

The TypeScript writer computes native statistics directly from WKB without materializing GeoJSON.
It skips non-finite values independently by dimension, omits Z or M bounds when absent, and emits
the complete unique set of ISO WKB type codes found in each row group.

## Alternatives

GeoParquet is the persistent Parquet representation; GeoArrow defines in-memory Arrow extension
layouts and metadata. loaders.gl preserves both layers and maps between their compatible semantics.
