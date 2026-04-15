# Overview

The `@loaders.gl/geotiff` module provides loader and source support for
[GeoTIFF](/docs/modules/geotiff/formats/geotiff) and OME-TIFF data.

GeoTIFF combines georeferencing metadata with multi-band raster imagery. The module now also
includes viewport-driven raster sources for typed raster access and texture-oriented rendering
workflows.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/geotiff
```

## Loaders and Sources

| Loader                                                                |
| --------------------------------------------------------------------- |
| [`GeoTIFFLoader`](/docs/modules/geotiff/api-reference/geotiff-loader) |
| [`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader) |
| [`OMETiffSourceLoader`](/docs/modules/geotiff/api-reference/ometiff-source-loader) |

## Additional APIs

- [`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader) returns `RasterData`
  payloads for viewport requests.
- [`OMETiffSourceLoader`](/docs/modules/geotiff/api-reference/ometiff-source-loader) returns typed OME-TIFF
  planes for non-geospatial image pyramids.

## Attributions

This module imports and wraps [geotiff.js](https://github.com/geotiffjs/geotiff.js/) under MIT license.
