# GeoParquet

![parquet-logo](../images/parquet-logo-small.png)
&emsp;
![apache-logo](../../../images/logos/apache-logo.png)

- _[`loaders.gl/parquet`](/docs/modules/parquet)_
- _[geoparquet.org](https://geoparquet.org)_

Geoparquet is a set of conventions for storing geospatial data in Parquet files.

Standardization is happening at [geoparquet.org](https://geoparquet.org).

GeoParquet file is a Parquet file that additionally follows these conventions:

- Geospatial metadata describing any geospatial columns is stored in the Parquet file's schema metadata (as stringified JSON).
- Geometry columns are [WKB](/docs/modules/wkt/formats/wkb) encoded (additional encodings will likely be added).

## Supported features checklist

| Type                                                                                         | Supported |
| -------------------------------------------------------------------------------------------- | --------- |
| Parse file metadata                                                                          | ✅        |
| Geometry column encoding: WKB                                                                | ✅        |
| Geometry column encoding: single-geometry type encodings based on the GeoArrow specification | ❌        |
| "crs" column metadata: transformt CRS to WGS84 with longitude, latitude representation.      | ❌        |
| "orientation" column metadata: reorder vertices if set "counterclockwise"                    | ❌        |
| "covering" column metadata: per-row bounding boxes                                           | ❌        |

## Data size limitation

Parquet files might be large in size (multiple gigabytes). The capacity of GeoParquetLoader is limited by the memory limitations of your current platform. As an example a Chrome tab crashes when it reaches a certain platform dependent size. 
	
As "covering" metadata is not supported yet, it is not possible to make an efficient filtering of data. To prevent memory overflow it is possible to use the `limit` loader option that limits number of rows being parsed. In that case the loader will return first `limit` rows, omitting the rest of file.

## Alternatives

GeoParquet can be compared to GeoArrow, as both are binary columnar formats with a high degree of similarity.
