# GeoParquet

- *[`loaders.gl/parquet`](/docs/modules/parquet)*
- *[geoparquet.org](https://geoparquet.org)*

Geoparquet is a set of conventions for storing geospatial data in Parquet files. 

Standardization is happening at [geoparquet.org](https://geoparquet.org).

GeoParquet file is a Parquet file that additionally follows these conventions:

- Geospatial metadata describing any geospatial columns is stored in the Parquet file's schema metadata (as stringified JSON).
- Geometry columns are [WKB](/docs/modules/wkt/formats/wkb) encoded (additional encodings will likely be added)/

## Alternatives

GeoParquet can be compared to GeoArrow, as both are binary columnar formats with a high degree of similarity.
