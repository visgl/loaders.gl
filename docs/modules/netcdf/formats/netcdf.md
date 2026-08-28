# NetCDF

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/netcdf`](/docs/modules/netcdf/api-reference)_
- _[NetCDF documentation](https://docs.unidata.ucar.edu/netcdf-c/current/)_

NetCDF stores named dimensions, variables, attributes, and typed multidimensional arrays. It is
widely used for weather, climate, ocean, and scientific data where array dimensions carry domain
meaning such as time, pressure level, latitude, and longitude.

## loaders.gl support

| Format feature | Support |
| --- | --- |
| NetCDF classic | Supported |
| 64-bit-offset files | Supported |
| Header-only remote discovery | Supported with bounded leading range reads |
| Numeric variable reads | Supported |
| Named dimension slicing | Supported |
| NetCDF-4/HDF5 storage | Not supported by this source |
| Automatic CF reprojection or coordinate-to-bounds planning | Not provided |

## Scan support

NetCDF uses the raster query vocabulary because variables and dimension slices are a more accurate
model than relational rows.

| Scan feature | Support |
| --- | --- |
| Entry point | `getRaster()` |
| Metadata | Variables, types, attributes, dimensions, record length, and file size |
| Variable selection | Pushdown to the selected result variables |
| Dimension selection | Named index or half-open `[start, stop)` slice, evaluated residually |
| Bounds and overview level | Unsupported |
| Output | Typed raster data with original variable/dimension metadata |
| Cancellation | Supported |
| Chunk or range pruning during data reads | Not implemented for classic-file execution |
