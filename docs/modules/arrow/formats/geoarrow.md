import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# GeoArrow

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for
GeoArrow CRS representations and column-specific metadata. The [conformance ledger](/docs/geoarrow-conformance-ledger)
defines the supported physical matrix.

<ArrowDocsTabs active="geoarrow" />

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/arrow`](/docs/modules/arrow)_ - loaders.gl implementation
- _[GeoArrow Specification](https://github.com/geoarrow/geoarrow)_
- _[Apache Arrow](https://arrow.apache.org/)_ - A specification for large in-memory columnar data.
- _[ArrowJS](/docs/arrowjs)_ - loaders.gl documentation on ArrowJS API.

## Overview

GeoArrow is a specification for storing geospatial data in Apache Arrow memory layout. It ensures geospatial tools can interoperate and leverage the growing Apache Arrow ecosystem.

GeoArrow enables each row in an Arrow table to represent a feature as defined by the OGC Simple Feature Access standard (i.e. Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, and GeometryCollection).

Aside from geometry, simple features can also have additional standard Arrow columns that provide additional non-spatial attributes for the feature.

Geospatial tabular data where one or more columns contains feature geometries and remaining columns define feature attributes. The GeoArrow specification defines how such vector features (geometries) can be stored in Arrow (and Arrow-compatible) data structures.

Note that GeoArrow is not a separate format from Apache Arrow rather, the GeoArrow specification simply describes additional conventions for metadata and layout of geospatial data. This means that a valid GeoArrow file is always a valid Arrow file. This is done through [Arrow extension type](https://arrow.apache.org/docs/format/Columnar.html#extension-types) definitions that ensure type-level metadata (e.g., CRS) is propagated when used in Arrow implementations.

## Scan support

GeoArrow tables use the same portable table query as ordinary Arrow tables. Geometry extension
metadata remains attached to the projected fields; scanning does not imply coordinate
transformation or a spatial index.

| Capability | Support |
| --- | --- |
| Schema and geometry-role discovery | Supported |
| Attribute predicates, projection, and limit | Supported |
| Expressions, ordering, aggregates, unions, and joins | Supported for in-memory tables |
| Geometry representation | Preserved when the selected columns retain it |
| Spatial predicate or spatial-index pushdown | Not provided by the generic Arrow executor |
| CRS transformation | Not performed |

## Geometry Types

| Geometry type              | Read | Write | Description          |
| -------------------------- | ---- | ----- | -------------------- |
| `geoarrow.point`           | ✅   | ✅    |                      |
| `geoarrow.multipoint`      | ✅   | ✅    |                      |
| `geoarrow.linestring`      | ✅   | ✅    |                      |
| `geoarrow.multilinestring` | ✅   | ✅    |                      |
| `geoarrow.polygon`         | ✅   | ✅    |                      |
| `geoarrow.multipolygon`    | ✅   | ✅    |                      |
| `geoarrow.geometry`        | ✅   | ✅    | Dense union          |
| `geoarrow.geometrycollection` | ✅ | ✅    | List of dense unions |
| `geoarrow.box`             | ✅   | ✅    |                      |
| `geoarrow.wkb`             | ✅   | ✅    | `WKB` interchange    |
| `geoarrow.wkt`             | ✅   | ✅    | `WKT` interchange    |

## Relationship with GeoParquet

The [GeoParquet](/docs/modules/parquet/formats/geoparquet) [specification](https://github.com/opengeospatial/geoparquet) is closely related to GeoArrow. Notable differences:

- GeoParquet is a file-level metadata specification
- GeoArrow is a field-level metadata and memory layout specification

## Metadata Evolution

`@loaders.gl/geoarrow` exposes `mergeGeoArrowMetadata()` for concatenation, projection, joins,
and derived columns. It unions geometry types in canonical order, preserves structurally equal
CRS and unknown metadata, and reports scalar conflicts. Use `strict` to reject unsafe claims,
`permissive` to retain the first value with a diagnostic, or `repair` to drop conflicting keys.

## Conversion Paths

Use `convertGeoArrowGeometry(table, 'native')` when a table will be scanned or rendered from
coordinates. The adaptive target selects concrete point, line, polygon, or multi-geometries for
homogeneous columns and uses `geoarrow.geometry` for genuinely mixed columns. Set
`coordinates: 'separated'` for one typed buffer per ordinate or `offsetType: 'int64'` for large
arrays.

WKB/WKT scalar columns may use standard, large, or Arrow view storage (`Binary`, `LargeBinary`,
`BinaryView`, `Utf8`, `LargeUtf8`, or `Utf8View`). View columns retain their variadic value buffers
through worker transfer-list collection.

WKB remains the compact interchange and persistence representation. WKT columns use direct
state-machine and native-buffer paths in both directions: parsing numeric tokens into the
GeoArrow builder and writing native coordinates without creating one GeoJSON object per feature.
Mixed WKT columns and GeometryCollections use typed union kernels as well, including recursively
nested collections, without a GeoJSON materialization bridge.

Recursive collection decoding is bounded by `maxGeometryCollectionDepth` (64 by default) on
`GeoArrowGeometryConvertOptions`. Set a smaller limit for untrusted inputs; exceeding the limit
produces an actionable conversion error rather than allowing unbounded parser recursion.

The same options expose opt-in resource budgets for ingestion boundaries. `maxGeometryBytes`
limits the total WKB/WKT payload bytes in one converted vector, while `maxGeometryVertices`
limits the total coordinate vertices in one vector. Both budgets are checked before identity
returns and before native allocation, including when the requested target already matches the
source. They are useful for service and worker boundaries that accept untrusted geometry; normal
in-memory conversions remain unlimited unless a caller supplies a budget.

For streaming Arrow batches, `convertGeoArrowBatches()` preserves record-batch boundaries and
checks cancellation between batches. If a WKB/WKT stream has no trusted `geometry_types` metadata,
`native` conversion selects a stable dense union seeded with all seven geometry families and all
four dimensions. A later batch can therefore introduce a new family without changing the stream
schema or forcing an earlier batch through a row-object bridge.

`mergeGeoArrowSchemas()` provides the corresponding schema-evolution boundary for concatenation,
rechunking, projection, and derived columns. It checks physical Arrow compatibility, merges field
and GeoParquet metadata deterministically, and reports conflicts under `strict`, `permissive`, or
`repair` policy. Strict and repair modes remove conflicting extension claims instead of retaining
metadata that no longer describes the merged physical field.
