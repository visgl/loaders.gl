import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';

# Overview

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for raster
CRS discovery, current native-CRS behavior, and the raster-warping roadmap.

<GeoTiffDocsTabs active="overview" />

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

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

| Loader / Source | Description |
| ---------------- | ----------- |
| [`GeoTIFFLoader`](/docs/modules/geotiff/api-reference/geotiff-loader) | Loads georeferenced GeoTIFF images. |
| [`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader) | Provides viewport-driven access to geospatial raster data. |
| [`OMETiffSourceLoader`](/docs/modules/geotiff/api-reference/ometiff-source-loader) | Provides typed non-geospatial OME-TIFF planes selected by level, time, z, and channel. |

## Additional APIs

- [`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader) returns `RasterData`
  payloads for viewport requests.
- [`OMETiffSourceLoader`](/docs/modules/geotiff/api-reference/ometiff-source-loader) returns typed OME-TIFF
  planes for non-geospatial image pyramids.

## Attributions

This module imports and wraps [geotiff.js](https://github.com/geotiffjs/geotiff.js/) under MIT license.
