---
title: '@loaders.gl/geotiff'
description: Read GeoTIFF, Cloud Optimized GeoTIFF, and OME-TIFF rasters with windows, bands, and metadata.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {RasterWindowGraphic} from '@site/src/components/docs/raster-window-graphic';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="Raster module"
  title="@loaders.gl/geotiff"
  description="The GeoTIFF module handles georeferencing, tiled imagery, multiband data, and multiscale OME-TIFF. Its source APIs can select native windows and overviews before decoding the pixels."
  tone="orange"
  logos={[{alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}]}
  meta={['GeoTIFF / COG', 'OME-TIFF', 'Windowed raster reads']}
  links={[
    {label: 'GeoTIFF format', to: '/docs/modules/geotiff/formats/geotiff'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<DocLiveExample label="GeoTIFF raster source example" height="440px">
  <ClientExample kind="geotiff" />
</DocLiveExample>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for raster
CRS discovery, current native-CRS behavior, and the raster-warping roadmap.

<GeoTiffDocsTabs active="overview" />

<RasterWindowGraphic kind="geotiff" />

<DocOrientation
  eyebrow="The raster path"
  title="Metadata first. Pixels second."
  description="Raster sources use georeferencing and overview metadata to choose a useful window, resolution, and band set before turning bytes into a typed result."
  tone="orange"
  items={[
    {label: 'Formats', value: 'GeoTIFF, Cloud Optimized GeoTIFF, and OME-TIFF'},
    {label: 'Selection', value: 'Bounds, overview, bands, channels, and slices'},
    {label: 'Output', value: 'Typed raster data or renderer-oriented texture data'},
    {label: 'Metadata', value: 'CRS, geotransform, dimensions, and multiscale layout'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/geotiff` module provides loader and source support for
[GeoTIFF](/docs/modules/geotiff/formats/geotiff) and OME-TIFF data.

<ReferenceBoundary
  title="Raster source and loader details"
  description="The sections below cover installation, loader and source APIs, raster windows, metadata, and scan behavior."
  tone="orange"
/>

GeoTIFF combines georeferencing metadata with multi-band raster imagery. The module now also
includes viewport-driven raster sources for typed raster access and texture-oriented rendering
workflows.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/geotiff
```

## Loaders and Sources

`GeoTIFFRasterSource` also implements the shared scan metadata contract. Call
`getQueryMetadata()` to discover raster bands, source bounds, and available overview levels for
the source-neutral scan query panel. Pixel reads use the common raster entry point, `getRaster()`,
and preserve GeoTIFF/COG range access, overview selection, band selection, and typed output.

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
