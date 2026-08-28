import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# GeoArrow

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for
GeoArrow CRS representations, column-specific metadata, and current preservation gaps.

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
| `geoarrow.point`           | ✅   | ❌    |                      |
| `geoarrow.multipoint`      | ✅   | ❌    |                      |
| `geoarrow.linestring`      | ✅   | ❌    |                      |
| `geoarrow.multilinestring` | ✅   | ❌    |                      |
| `geoarrow.polygon`         | ✅   | ❌    |                      |
| `geoarrow.multipolygon`    | ✅   | ❌    |                      |
| `geoarrow.wkb`             | ✅   | ❌    | `WKB` also supported |
| `geoarrow.wkt`             | ✅   | ❌    | `WKT` also supported |

## Relationship with GeoParquet

The [GeoParquet](/docs/modules/parquet/formats/geoparquet) [specification](https://github.com/opengeospatial/geoparquet) is closely related to GeoArrow. Notable differences:

- GeoParquet is a file-level metadata specification
- GeoArrow is a field-level metadata and memory layout specification
