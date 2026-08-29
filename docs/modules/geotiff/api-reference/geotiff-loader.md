---
title: GeoTIFFLoader
description: Read georeferenced TIFF imagery and its spatial metadata.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoTIFF loader"
  title="Read raster values with their spatial context."
  description="GeoTIFFLoader is the entry point for TIFF imagery whose tags describe scale, bounds, and coordinate reference. Use the source APIs when a cloud query needs selective ranges or windows."
  tone="mint"
  meta={['TIFF input', 'GeoTIFF metadata', 'Typed raster output']}
  links={[
    {label: 'GeoTIFF format', to: '/docs/modules/geotiff/formats/geotiff'},
    {label: 'GeoTIFF module', to: '/docs/modules/geotiff'}
  ]}
/>

<GeoTiffDocsTabs active="geotiffloader" />

<DocOrientation
  eyebrow="Loader or source?"
  title="Load a complete image, or query a remote raster."
  description="The loader is the simple complete-file path. GeoTIFFSourceLoader adds metadata discovery, range reads, windows, overview selection, and cancellation for cloud-native access."
  tone="mint"
  items={[
    {label: 'Loader', value: 'Complete TIFF image and metadata'},
    {label: 'Source', value: 'Bounded windows and HTTP ranges'},
    {label: 'Output', value: 'Typed image data with dimensions'},
    {label: 'Metadata', value: 'Tags, transform, bounds, and CRS'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<ReferenceBoundary
  title="GeoTIFF loader details"
  description="The reference below covers complete-file loading, the returned raster shape, metadata, and the boundary between GeoTIFFLoader and GeoTIFFSourceLoader."
  tone="mint"
/>

`GeoTIFFLoader` parses a complete GeoTIFF from an `ArrayBuffer` and reads the first image in
the file. It is the straightforward path for local files or applications that already have
the complete file in memory. For remote windows, overviews, or band-selective reads, use
[`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader).

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GeoTIFFLoader} from '@loaders.gl/geotiff';

const image = await load('example.tif', GeoTIFFLoader);

console.log(image.width, image.height);
console.log(image.bounds, image.crs);
```

## Returned data

The loader returns an object containing:

| Field | Description |
| --- | --- |
| `data` | An RGBA or RGB `Uint8ClampedArray` containing decoded pixel values. |
| `width`, `height` | Dimensions of the first image in pixels. |
| `bounds` | The image bounding box from GeoTIFF georeferencing metadata. |
| `crs` | The projected EPSG identifier when it is present in the GeoKeys. |
| `metadata` | The raw GeoTIFF GeoKeys returned by the parser. |

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `geotiff.enableAlpha` | `boolean` | `true` | Include an alpha channel when the source image supports it. |

`GeoTIFFLoader` currently reads only the first image and uses `readRGB()`. It does not provide
windowed reads, overview selection, or reprojection. Those operations belong to the source API.
