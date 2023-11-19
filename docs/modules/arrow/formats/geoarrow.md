# GeoArrow

![arrow-logo](../images/apache-arrow-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- *[`@loaders.gl/arrow`](/docs/modules/arrow)* - loaders.gl implementation
- *[GeoArrow Specification](https://github.com/geoarrow/geoarrow)
- *[Apache Arrow](https://arrow.apache.org/)* - A specification for large in-memory columnar data.
- *[ArrowJS](/docs/arrowjs)* - loaders.gl documentation on ArrowJS API.

## Overview

GeoArrow is a specification for storing geospatial data in Apache Arrow and Arrow-compatible data structures and formats.

Geospatial data often comes in tabular format, with one or more columns with feature geometries and additional columns with feature attributes. The Arrow columnar memory model is well-suited to store vector features and their attribute data. The GeoArrow specification defines how the vector features (geometries) can be stored in Arrow (and Arrow-compatible) data structures.

GeoArrow supports vector data defined by the Simple Feature Access standard (Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, and GeometryCollection). Next to a geometry, simple features can also have non-spatial attributes that describe the feature.

Note that GeoArrow is not a separate format. Rather, the GeoArrow specification simply describes additional conventions for metadata and layout of . This means that a valid GeoArrow file is always also a valid Arrow file.

The Arrow extension type definitions that ensure type-level metadata (e.g., CRS) is propagated when used in Arrow implementations (extension-types.md)
Defining a standard and efficient way to store geospatial data in the Arrow memory layout enables interoperability between different tools and ensures geospatial tools can leverage the growing Apache Arrow ecosystem:

- Efficient, columnar file formats. Leveraging the performant and compact storage of Apache Parquet as a vector data format in geospatial tools using GeoParquet
- Accelerated between-process geospatial data exchange using Apache Arrow IPC message format and Apache Arrow Flight
- Zero-copy in-process geospatial data transport using the Apache Arrow C Data Interface (e.g., GDAL)
- Shared libraries for geospatial data type representation and computation for query engines that support columnar data formats (e.g., Velox, DuckDB, and Acero)

## Relationship with GeoParquet

The GeoParquet specification  started as part of the GeoArrow, but was moved out into its own repo (https://github.com/opengeospatial/geoparquet). Notable differences:
  
- GeoParquet is a file-level metadata specification
- GeoArrow is a field-level metadata and memory layout specification

## Geometry Types

| Geometry type              | Read | Write | Description |
| -------------------------- | ---- | ----- | ----------- |
| `geoarrow.multipolygon`    | ✅    | ❌     |             |
| `geoarrow.polygon`         | ✅    | ❌     |             |
| `geoarrow.multipoint`      | ✅    | ❌     |             |
| `geoarrow.point`           | ✅    | ❌     |             |
| `geoarrow.multilinestring` | ✅    | ❌     |             |
| `geoarrow.linestring`      | ✅    | ❌     |             |
| `geoarrow.wkb`             | ❌    | ❌     |             |
| `geoarrow.wkt`             | ❌    | ❌     |             |