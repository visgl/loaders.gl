Raster module

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF

# GeoTIFF and OME-TIFF

The GeoTIFF module handles georeferencing, tiled imagery, multiband data, and multiscale OME-TIFF. Its source APIs can select native windows and overviews before decoding the pixels.

[GeoTIFF format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

⛶⛶ Explore fullscreen

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for raster CRS discovery, current native-CRS behavior, and the raster-warping roadmap.

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF[Try GeoTIFF](https://loaders.gl/next/examples/geospatial/geotiff)[Try OME-TIFF](https://loaders.gl/next/examples/bioimaging/ome-tiff)[Overview](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFFLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)[GeoTIFFRasterLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md)[GeoTIFFSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)[OMETiffSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md)

Windowed raster access

## Read the window that answers the question.

Raster sources use metadata before pixels: discover the layout, choose the useful window, and decode only the ranges or chunks that cover it.

01 · discover

### GeoTIFF / Cloud Optimized GeoTIFF

TIFF pages and tiles carry georeferencing, bands, and overview metadata.

boundsbandsoverviews

pla&#x6E;**→**

02 · select

### Select a raster window

Use the coordinate system and resolution that match the request.

bboxoverviewband

rea&#x64;**→**

[03 · application result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

### [Typed raster result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[Pixels, dimensions, transform, and CRS stay available to the application.<!-- --> ↗](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[pixelstransformCRS](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

A local file may use direct offsets; a cloud source may use HTTP ranges or object-store chunks. The application-facing selection remains the same.

The raster path

## Metadata first. Pixels second.

Raster sources use georeferencing and overview metadata to choose a useful window, resolution, and band set before turning bytes into a typed result.

01

Formats

GeoTIFF, Cloud Optimized GeoTIFF, and OME-TIFF

02

Selection

Bounds, overview, bands, channels, and slices

03

Output

Typed raster data or renderer-oriented texture data

04

Metadata

CRS, geotransform, dimensions, and multiscale layout

![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

The `@loaders.gl/raster` module provides loader and source support for [GeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) and OME-TIFF data.

Detailed guide

## Raster source and loader details

The sections below cover installation, loader and source APIs, raster windows, metadata, and scan behavior.

GeoTIFF combines georeferencing metadata with multi-band raster imagery. The module now also includes viewport-driven raster sources for typed raster access and texture-oriented rendering workflows.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/raster geotiff
```

## Loaders and Sources[​](#loaders-and-sources "Direct link to Loaders and Sources")

`GeoTIFFRasterSource` also implements the shared scan metadata contract. Call `getQueryMetadata()` to discover raster bands, source bounds, and available overview levels for the source-neutral scan query panel. Pixel reads use the common raster entry point, `getRaster()`, and preserve GeoTIFF/COG range access, overview selection, band selection, and typed output.

| Loader / Source                                                                                                          | Description                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [`GeoTIFFLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)              | Loads georeferenced GeoTIFF images.                                                                          |
| [`GeoTIFFRasterLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md) | Loads original typed numeric bands and per-image / per-band metadata for geoid grids and scientific rasters. |
| [`GeoTIFFSourceLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md) | Provides viewport-driven access to geospatial raster data.                                                   |
| [`OMETiffSourceLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md) | Provides typed non-geospatial OME-TIFF planes selected by level, time, z, and channel.                       |

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

* [`GeoTIFFSourceLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md) returns `RasterData` payloads for viewport requests.
* [`OMETiffSourceLoader`](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md) returns typed OME-TIFF planes for non-geospatial image pyramids.

## Attributions[​](#attributions "Direct link to Attributions")

This module imports and wraps [geotiff.js](https://github.com/geotiffjs/geotiff.js/) under MIT license.

The [original TIFF decoder core](https://loaders.gl/next/docs/modules/raster/geotiff/tiff-decoder-core.md) handles supported numeric files and retains geotiff.js compatibility fallback.

The `geotiff` decoder is an optional peer dependency. See the [raster package](https://loaders.gl/next/docs/modules/raster.md) for parser entry points and source constructors.
