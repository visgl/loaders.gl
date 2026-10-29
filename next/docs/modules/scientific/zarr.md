Chunked array module

![](/next/images/format-logos/zarr-logo.svg)

# Read the chunks that cover the question.

The Zarr module opens chunked multidimensional data and exposes source APIs for spatial, multiscale, and named-dimension selection. It supports Earth-science rasters as well as OME-Zarr bioimaging data.

[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

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

The chunked-array path

## Discover the array, then select a window.

Zarr stores large arrays as independently addressable chunks. Source metadata identifies dimensions, scales, variables, and coordinate meaning before a request reads the selected region.

01

Datasets

GeoZarr, OME-Zarr, and generic Zarr arrays

02

Selection

Spatial windows, bands, channels, time, and levels

03

Access

Chunk reads from local files or object storage

04

Output

Typed raster data with source metadata

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for GeoZarr CRS discovery, current native-CRS behavior, and the raster-warping roadmap.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

The `@loaders.gl/scientific` module reads chunked, multidimensional [Zarr](https://zarr.dev/) arrays. It supports the existing pixel-pyramid API, an OME-Zarr source API for bioimaging, and a GeoZarr/CF source API for georeferenced Earth-science rasters.

Detailed guide

## Zarr source and array details

The sections below cover installation, source APIs, metadata discovery, chunk selection, and the supported Zarr conventions.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/scientific
```

## APIs[​](#apis "Direct link to APIs")

* [`OMEZarrSourceLoader`](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/ome-zarr-source-loader.md) opens OME-Zarr v2 and v3 image groups through `createDataSource()` or `load()`.
* [`GeoZarrSourceLoader`](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md) opens one georeferenced Zarr data variable and reads native spatial windows with named time, vertical, or band selections.
* [`SpatialDataSourceLoader`](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/spatial-data-source-loader.md) discovers named images, labels, points, shapes, and tables from a SpatialData root. It opens Zarr-backed raster and AnnData array elements directly and reports interoperable Parquet-dataset and GeoParquet URLs for points and shapes.
* `loadZarrConsolidatedMetadata()` probes `.zmetadata`, `zmetadata`, and `zarr.json` documents and reports top-level arrays and groups.
* `loadZarr()` and `ZarrPixelSource` provide the legacy Zarr v2 pixel-pyramid API.

## Example[​](#example "Direct link to Example")

```
import {createDataSource} from '@loaders.gl/core';

import {OMEZarrSourceLoader} from '@loaders.gl/scientific/zarr';



const source = createDataSource('https://example.com/spatialdata.zarr', [OMEZarrSourceLoader], {

  zarr: {path: 'images/example-image'}

});



const metadata = await source.getMetadata();

const raster = await source.getRaster({level: 0, channels: [0, 1, 2]});
```

The [OME-Zarr example](https://loaders.gl/next/examples/bioimaging/ome-zarr) demonstrates browsing a SpatialData-style root and selecting an image pyramid.

For climate, weather, ocean, satellite, and other Earth-science stores, use `GeoZarrSourceLoader`. It recognizes the current GeoZarr `proj:` and `spatial:` conventions as well as the regular one-dimensional coordinate arrays commonly written by xarray/CF workflows. The [GeoZarr deck.gl example](https://loaders.gl/next/examples/geospatial/geo-zarr) reads a public NASA POWER climatology store directly from S3 and renders monthly solar irradiance on an interactive map.

## Feature matrix[​](#feature-matrix "Direct link to Feature matrix")

| Capability                                                | Zarr v2                   | Zarr v3     | OME-Zarr                     | GeoZarr / CF                                | Status                                              |
| --------------------------------------------------------- | ------------------------- | ----------- | ---------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Browser and Node.js reads                                 | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| HTTP range/chunked access                                 | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| Consolidated metadata discovery                           | `.zmetadata`, `zmetadata` | `zarr.json` | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| Multidimensional arrays and named dimensions              | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| Chunk-aware raster reads                                  | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| OME image channels, time, and z planes                    | —                         | —           | ✅ Yes                       | —                                           | ✅ Available                                        |
| OME multiscale pyramids                                   | —                         | —           | ✅ Yes                       | —                                           | ✅ Available                                        |
| Automatic display-level selection                         | —                         | —           | ✅ Yes                       | —                                           | ✅ Available                                        |
| Scan metadata and source discovery                        | —                         | —           | ✅ Yes                       | ✅ Yes                                      | ✅ Available through both raster sources            |
| GeoZarr `proj:` and `spatial:` metadata                   | —                         | —           | —                            | ✅ Yes                                      | ✅ Available                                        |
| CF/xarray coordinates, time, vertical, and band selection | —                         | —           | —                            | ✅ Yes                                      | ✅ Available                                        |
| Viewport-driven geospatial windows                        | —                         | —           | —                            | ✅ Yes                                      | ✅ Available                                        |
| Typed planar or interleaved channel output                | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| Zarrita-backed v2/v3 implementation                       | ✅ Yes                    | ✅ Yes      | ✅ Yes                       | ✅ Yes                                      | ✅ Available                                        |
| SpatialData images, labels, points, shapes, and tables    | —                         | —           | ✅ Yes                       | —                                           | ⚠️ Discovery and typed storage references available |
| Codec expansion and broader multiscale layouts            | ⚠️ Partial                | ⚠️ Partial  | ❌ Planned                   | ❌ Planned                                  | ❌ Planned                                          |
| Common raster query execution                             | —                         | —           | Levels, channels, and slices | Native spatial windows and named selections | ✅ Available                                        |

## Scan support[​](#scan-support "Direct link to Scan support")

Zarr participates through two raster sources. Both read only the selected chunks and preserve typed array output, but their query vocabulary reflects the kind of array being opened.

| Capability            | OME-Zarr                                         | GeoZarr / CF                                           |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Entry point           | `getRaster()`                                    | `getRaster()`                                          |
| Metadata discovery    | Channels, dimensions, multiscale levels          | Variable, dtype, dimensions, bounds, CRS               |
| Spatial window        | Image window                                     | Native-CRS viewport bounds                             |
| Resolution            | Multiscale level pushdown                        | Native resolution; explicit level unsupported          |
| Non-spatial selection | Channels, time, and z slices                     | Named time, vertical, band, or other dimension indices |
| Physical access       | Selected Zarr chunks and codecs                  | Selected Zarr chunks and codecs                        |
| Output                | Typed planar or interleaved pixels               | Typed raster data                                      |
| Reprojection          | Not applicable to ordinary OME image coordinates | ❌ Not performed                                       |

Query metadata is suitable for populating source-neutral controls before pixel data is requested. GeoZarr bounds must use the source CRS; callers should reproject the viewport before requesting a window when necessary.

## SpatialData containers[​](#spatialdata-containers "Direct link to SpatialData containers")

`SpatialDataSourceLoader` normalizes the five standard SpatialData namespaces without loading element payloads. Each element retains its axes, coordinate transformations, format version, and original attributes. Image and label descriptors use `ome-zarr`; point descriptors use `parquet-dataset`; shape descriptors use `geoparquet`; and table descriptors use `anndata-zarr`.

```
import {createDataSource} from '@loaders.gl/core';

import {SpatialDataSourceLoader} from '@loaders.gl/scientific/zarr';



const source = createDataSource(rootUrl, [SpatialDataSourceLoader]);

const metadata = await source.getMetadata();

const image = await source.createRasterSource('image', metadata.images[0].name);

const expression = await source.createTableArraySource('annotations', 'X');
```

SpatialData points are Dask-style Parquet datasets and shapes are GeoParquet files. Their normalized descriptors expose the canonical `points.parquet` and `shapes.parquet` URLs so applications can hand them to the corresponding loaders.gl Parquet sources without coupling the lightweight Zarr module to the complete Parquet runtime.

## Attributions[​](#attributions "Direct link to Attributions")

The OME-Zarr source uses [zarrita.js](https://zarrita.dev/) under the MIT license. The legacy Zarr v2 API wraps [zarr.js](https://github.com/gzuidhof/zarr.js/) under the MIT license.
