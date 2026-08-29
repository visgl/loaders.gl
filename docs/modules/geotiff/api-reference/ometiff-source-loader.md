---
title: OMETiffSourceLoader
description: Discover OME-TIFF image metadata and read selected channels, dimensions, and pyramid levels as raster data.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoTIFF API / bioimaging"
  title="Read an OME-TIFF pyramid as selected raster data."
  description="OMETiffSourceLoader discovers OME image metadata and reads chosen channels, dimensions, and pyramid levels from a multi-image TIFF without forcing the application to decode every plane."
  tone="orange"
  meta={['OME-TIFF', 'Multichannel images', 'Pyramid-aware reads']}
  links={[
    {label: 'GeoTIFF module', to: '/docs/modules/geotiff'},
    {label: 'OME-TIFF example', to: '/examples/bioimaging/ome-tiff'},
    {label: 'OME-Zarr source', to: '/docs/modules/zarr/api-reference/ome-zarr-source-loader'}
  ]}
/>

<GeoTiffDocsTabs active="ometiffsource" />

<DocOrientation
  eyebrow="Multichannel raster source"
  title="Discover the image, then request a plane."
  description="OME-TIFF stores image dimensions, channel descriptions, and pyramid levels alongside TIFF data. The source turns those dimensions into explicit metadata and raster requests."
  tone="orange"
  items={[
    {label: 'Discover', value: 'Read channel count, dtype, levels, and OME dimensions.'},
    {label: 'Select', value: 'Choose channels, time, depth, and pyramid level.'},
    {label: 'Read', value: 'Decode the selected raster plane from the TIFF structure.'},
    {label: 'Compare', value: 'Use the same source shape as OME-Zarr image pyramids.'}
  ]}
/>

<ReferenceBoundary
  title="OMETiffSourceLoader reference"
  description="The detailed reference covers source creation, metadata, raster parameters, image selection, and the relationship to the underlying GeoTIFF loader."
  tone="orange"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`OMETiffSourceLoader` creates a non-geospatial source for OME-TIFF image pyramids.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMETiffSourceLoader} from '@loaders.gl/geotiff';

const source = createDataSource('multi-channel.ome.tif', [OMETiffSourceLoader], {
  core: {type: 'ometiff'},
  ometiff: {}
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({
  channels: [0, 1, 2],
  level: 0,
  t: 0,
  z: 0
});
```

## API

### `getMetadata(): Promise<OMETiffSourceLoaderMetadata>`

Returns normalized OME image metadata for the first image in the file, including channel count,
dtype, pyramid levels, and OME dimension sizes.

### `getRaster(parameters?: GetOMETiffParameters): Promise<RasterData>`

Loads one 2D OME-TIFF plane or a multi-channel composite.

- `level?: number` selects the pyramid level.
- `t?: number` selects the time index.
- `z?: number` selects the z slice.
- `channels?: number[]` selects one or more channels.
- `interleaved?: boolean` returns one interleaved typed array for multi-channel reads.
