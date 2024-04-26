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
| "crs" column metadata: reorder vertices if set "counterclockwise"                            | ❌        |
| "orientation" column metadata: reorder vertices if set "counterclockwise"                    | ❌        |
| "covering" column metadata: per-row bounding boxes                                           | ❌        |

## Data size limitation

Parquet files might be large in size (multiple gigabytes). The capacity of GeoParquetLoader is limited by the platform limitations. As an example in Chrome tab is chrashed when it reachs 4GB memory size. As "coverting" columns are not supported yet, it is not possible to make an efficient filtering of data. To prevent memory overflow it is possible to use the `limit` loader option that limits number of output rows. In that case the loader will return first `n` rows ommiting the rest of file.

## Alternatives

GeoParquet can be compared to GeoArrow, as both are binary columnar formats with a high degree of similarity.
