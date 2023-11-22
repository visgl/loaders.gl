# GeoArrow

![arrow-logo](../images/apache-arrow-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- *[`@loaders.gl/arrow`](/docs/modules/arrow)* - loaders.gl implementation
- *[GeoArrow Specification](https://github.com/geoarrow/geoarrow)
- *[Apache Arrow](https://arrow.apache.org/)* - A specification for large in-memory columnar data.
- *[ArrowJS](/docs/arrowjs)* - loaders.gl documentation on ArrowJS API.

## Overview

GeoArrow is a specification for storing geospatial data in Apache Arrow memory layout. It ensures geospatial tools can interoperate and leverage the growing Apache Arrow ecosystem.

GeoArrow enables each row in an Arrow table to represent a feature as defined by the OGC Simple Feature Access standard (i.e. Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, and GeometryCollection). 

Aside from geometry, simple features can also have additional standard Arrow columns that provide additional non-spatial attributes for the feature.

Geospatial tabular data where one or more columns contains feature geometries and remaining columns define feature attributes. The GeoArrow specification defines how such vector features (geometries) can be stored in Arrow (and Arrow-compatible) data structures.

Note that GeoArrow is not a separate format from Apache Arrow rather, the GeoArrow specification simply describes additional conventions for metadata and layout of geospatial data. This means that a valid GeoArrow file is always a valid Arrow file. This is done through [Arrow extension type](https://arrow.apache.org/docs/format/Columnar.html#extension-types) definitions that ensure type-level metadata (e.g., CRS) is propagated when used in Arrow implementations.


## Geometry Types

| Geometry type              | Read | Write | Description          |
| -------------------------- | ---- | ----- | -------------------- |
| `geoarrow.point`           | ✅    | ❌     |                      |
| `geoarrow.multipoint`      | ✅    | ❌     |                      |
| `geoarrow.linestring`      | ✅    | ❌     |                      |
| `geoarrow.multilinestring` | ✅    | ❌     |                      |
| `geoarrow.polygon`         | ✅    | ❌     |                      |
| `geoarrow.multipolygon`    | ✅    | ❌     |                      |
| `geoarrow.wkb`             | ✅    | ❌     | `WKB` also supported |
| `geoarrow.wkt`             | ✅    | ❌     | `WKT` also supported |

## Relationship with GeoParquet

The [GeoParquet](/docs/modules/parquet/formats/geoparquet) [specification](https://github.com/opengeospatial/geoparquet) is closely related to GeoArrow. Notable differences:
  
- GeoParquet is a file-level metadata specification
- GeoArrow is a field-level metadata and memory layout specification
