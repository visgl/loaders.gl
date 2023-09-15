# GeoParquet

- *[`loaders.gl/parquet`](/docs/modules/parquet)*
- *[geoparquet.org](https://geoparquet.org)*

Geoparquet is a set of conventions for storing geospatial data in Parquet files. 

Standardization is happening at [geoparquet.org](https://geoparquet.org).

GeoParquet is similar to GeoArrow, as both are binary columnar formats with a high degree of similarity.

GeoParquet file is a Parquet file that additionally follows these conventions:

- JSON encoded metadata stored in the Parquet file's schema metadata.
- WKB encoded geometry columns
