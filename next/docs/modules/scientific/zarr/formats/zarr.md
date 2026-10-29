Chunked multidimensional data

![](/next/images/format-logos/zarr-logo.svg)

# Read the array chunks that answer the question.

Zarr stores typed multidimensional arrays in independently addressable chunks. OME-Zarr and GeoZarr add conventions for images, coordinates, dimensions, transforms, and spatial metadata.

[Zarr module](https://loaders.gl/next/docs/modules/scientific/zarr.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/zarr.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

Windowed raster access

## Read the window that answers the question.

Raster sources use metadata before pixels: discover the layout, choose the useful window, and decode only the ranges or chunks that cover it.

01 · discover

### Zarr / GeoZarr / OME-Zarr

Arrays, dimensions, scales, and conventions describe independently addressable chunks.

dimensionschunksscales

pla&#x6E;**→**

02 · select

### Select a named window

Choose variables, channels, levels, time, or spatial slices before reading chunks.

windowvariablelevel

rea&#x64;**→**

[03 · application result](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

### [Typed array result](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

[Values return with dimension metadata and coordinate meaning intact.<!-- --> ↗](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

[valuesdimensionsmetadata](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

A local file may use direct offsets; a cloud source may use HTTP ranges or object-store chunks. The application-facing selection remains the same.

The array boundary

## Keep the dimensions named and the chunks independent.

The storage model stays multidimensional. loaders.gl can discover variables and dimensions, select windows or levels, and return typed raster data without flattening away the array’s meaning.

01

Storage

Typed arrays split into addressable chunks

02

Conventions

OME-Zarr, GeoZarr, CF, and xarray metadata

03

Selection

Windows, channels, levels, and named slices

04

Output

Typed raster data with dimension metadata

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

* *[`@loaders.gl/scientific/zarr`](https://loaders.gl/next/docs/modules/scientific/zarr.md)*
* *[Zarr specification](https://zarr-specs.readthedocs.io/)*
* *[OME-Zarr specification](https://ngff.openmicroscopy.org/)*

Zarr stores typed multidimensional arrays as independently addressable chunks. OME-Zarr adds bioimaging conventions such as multiscale image pyramids, channels, and labeled dimensions. GeoZarr and CF/xarray conventions add coordinate reference systems, transforms, coordinate arrays, and named scientific dimensions.

Detailed guide

## Array conventions and scan behavior

The sections below compare Zarr generations and conventions, then describe chunk selection and raster query behavior.

## Format support[​](#format-support "Direct link to Format support")

| Capability                      | Zarr v2         | Zarr v3         | OME-Zarr          | GeoZarr / CF                       |
| ------------------------------- | --------------- | --------------- | ----------------- | ---------------------------------- |
| Metadata discovery              | ✅ Supported    | ✅ Supported    | ✅ Supported      | ✅ Supported                       |
| Chunk reads and codecs          | ✅ Supported    | ✅ Supported    | ✅ Supported      | ✅ Supported                       |
| Multidimensional arrays         | ✅ Supported    | ✅ Supported    | ✅ Supported      | ✅ Supported                       |
| Multiscale image levels         | Format-specific | Format-specific | ✅ Supported      | Not assumed                        |
| Spatial CRS and transform       | Not inherent    | Not inherent    | Not required      | ✅ Supported                       |
| Named time/z/band selection     | Array-dependent | Array-dependent | ✅ Supported      | ✅ Supported                       |
| SpatialData container discovery | ✅ Supported    | ✅ Supported    | Images and labels | Tables and geometries by reference |

## SpatialData support[​](#spatialdata-support "Direct link to SpatialData support")

| Element | On-disk representation      | loaders.gl integration                                       |
| ------- | --------------------------- | ------------------------------------------------------------ |
| Images  | OME-Zarr image group        | `OMEZarrImageSource` through `createRasterSource()`          |
| Labels  | OME-Zarr label group        | `OMEZarrImageSource` through `createRasterSource()`          |
| Points  | Partitioned Parquet dataset | Typed `parquet-dataset` descriptor and canonical payload URL |
| Shapes  | GeoParquet file             | Typed `geoparquet` descriptor and canonical payload URL      |
| Tables  | AnnData-Zarr group          | Generic array access through `createTableArraySource()`      |

`SpatialDataSourceLoader` discovers these elements from consolidated metadata without materializing pixel, geometry, or annotation payloads. It retains element axes, coordinate transformations, format versions, and original attributes for downstream interoperability.

## Scan support[​](#scan-support "Direct link to Scan support")

| Scan feature          | OME-Zarr                                     | GeoZarr / CF                             |
| --------------------- | -------------------------------------------- | ---------------------------------------- |
| Entry point           | `getRaster()`                                | `getRaster()`                            |
| Discovery             | Channels, dimensions, levels                 | Variable, dtype, dimensions, bounds, CRS |
| Spatial selection     | Image window                                 | Native-CRS viewport window               |
| Resolution            | Multiscale level pushdown                    | Native resolution                        |
| Non-spatial selection | Channels, time, z                            | Named dimension indices                  |
| Physical access       | Selected chunks                              | Selected chunks                          |
| Output                | Typed image data                             | Typed raster data                        |
| Reprojection          | Not applicable to ordinary image coordinates | ❌ Not performed                         |

The common contract standardizes discovery and query meaning; it does not hide the array's native dimension labels, chunk layout, or coordinate system.
