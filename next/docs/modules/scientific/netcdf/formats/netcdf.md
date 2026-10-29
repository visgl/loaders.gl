Scientific array format

![](/next/images/format-logos/netcdf-logo.png)NetCDF

# Keep the dimensions that give data meaning.

NetCDF stores typed multidimensional arrays together with named dimensions and attributes, making time, level, latitude, longitude, and other scientific axes part of the data model.

[NetCDF API reference](https://loaders.gl/next/docs/modules/scientific/netcdf/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/netcdf/api-reference.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

The array model

## Choose the variable and slice the dimensions.

NetCDF is most useful when the axes are meaningful. loaders.gl preserves those names and attributes while allowing a caller to request only a selected numeric variable and half-open dimension ranges.

01

Describe

Dimensions, variables, attributes, and types

02

Select

A numeric variable and named dimension slices

03

Read

The corresponding classic-file ranges

04

Return

Typed data with original metadata attached

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`@loaders.gl/scientific/netcdf`](https://loaders.gl/next/docs/modules/scientific/netcdf/api-reference.md)*
* *[NetCDF documentation](https://docs.unidata.ucar.edu/netcdf-c/current/)*

NetCDF stores named dimensions, variables, attributes, and typed multidimensional arrays. It is widely used for weather, climate, ocean, and scientific data where array dimensions carry domain meaning such as time, pressure level, latitude, and longitude.

Detailed guide

## NetCDF structure and support

The sections below describe the file variants, source discovery, variable selection, dimension slicing, and current implementation boundaries.

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

| Format feature                                             | Support                                       |
| ---------------------------------------------------------- | --------------------------------------------- |
| NetCDF classic                                             | ✅ Supported                                  |
| 64-bit-offset files                                        | ✅ Supported                                  |
| Header-only remote discovery                               | ✅ Supported with bounded leading range reads |
| Numeric variable reads                                     | ✅ Supported                                  |
| Named dimension slicing                                    | ✅ Supported                                  |
| NetCDF-4/HDF5 storage                                      | ❌ Not supported by this source               |
| Automatic CF reprojection or coordinate-to-bounds planning | ❌ Not provided                               |

## Scan support[​](#scan-support "Direct link to Scan support")

NetCDF uses the raster query vocabulary because variables and dimension slices are a more accurate model than relational rows.

| Scan feature                             | Support                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Entry point                              | ✅ `getRaster()`                                                          |
| Metadata                                 | ✅ Variables, types, attributes, dimensions, record length, and file size |
| Variable selection                       | ✅ Pushdown to the selected result variables                              |
| Dimension selection                      | ✅ Named index or half-open `[start, stop)` slice, evaluated residually   |
| Bounds and overview level                | ❌ Unsupported                                                            |
| Output                                   | ✅ Typed raster data with original variable/dimension metadata            |
| Cancellation                             | ✅ Supported                                                              |
| Chunk or range pruning during data reads | ❌ Not implemented for classic-file execution                             |
