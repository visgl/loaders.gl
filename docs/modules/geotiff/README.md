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
| [`GeoTIFFSource`](/docs/modules/geotiff/api-reference/geotiff-source) |
| [`OMETiffSource`](/docs/modules/geotiff/api-reference/ometiff-source) |

## Additional APIs

- [`GeoTIFFSource`](/docs/modules/geotiff/api-reference/geotiff-source) returns `RasterData`
  payloads for viewport requests.
- [`OMETiffSource`](/docs/modules/geotiff/api-reference/ometiff-source) returns typed OME-TIFF
  planes for non-geospatial image pyramids.

## Attributions

This module imports and wraps [geotiff.js](https://github.com/geotiffjs/geotiff.js/) under MIT license.
