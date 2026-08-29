---
title: OMEZarrSourceLoader
description: Open OME-Zarr v2 and v3 image pyramids and read selected multiscale raster regions.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Zarr API / bioimaging"
  title="Read an image pyramid at the level and channels you need."
  description="OMEZarrSourceLoader discovers OME image metadata, resolves multiscale arrays, and reads selected raster windows from local or remote stores without flattening the entire pyramid first."
  tone="orange"
  meta={['OME-Zarr v2 / v3', 'Multiscale images', 'Chunked raster reads']}
  links={[
    {label: 'Zarr module', to: '/docs/modules/zarr'},
    {label: 'OME-Zarr example', to: '/examples/bioimaging/ome-zarr'},
    {label: 'GeoZarr source', to: '/docs/modules/zarr/api-reference/geo-zarr-source-loader'}
  ]}
/>

<DocOrientation
  eyebrow="Image-pyramid source"
  title="Discover dimensions, then request a view."
  description="OME-Zarr describes channels, dimensions, scales, and image groups separately from the chunks that store pixels. The source keeps those choices explicit in the metadata and raster request."
  tone="orange"
  items={[
    {label: 'Discover', value: 'Read OME metadata, dimensions, channels, and pyramid levels.'},
    {label: 'Select', value: 'Choose level, time, depth, channels, and output size.'},
    {label: 'Read', value: 'Fetch only the chunks covering the requested raster.'},
    {label: 'Render', value: 'Return typed raster data for the application or visualization layer.'}
  ]}
/>

<ReferenceBoundary
  title="OME-Zarr source reference"
  description="The detailed reference covers store discovery, metadata options, dimension selection, channel handling, and raster output."
  tone="orange"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`OMEZarrSourceLoader` creates a non-geospatial source for OME-Zarr v2 and v3 image pyramids.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/spatialdata.zarr', [OMEZarrSourceLoader], {
  zarr: {
    path: 'images/example-image',
    requireConsolidatedMetadata: true
  },
  omezarr: {
    interleaved: false,
    defaultChannels: [0, 1, 2]
  }
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({level: 'auto', width: 1024, height: 768, t: 0, z: 0});
```

## Source options

### `zarr`

- `path?: string | null` selects an image group below the store root.
- `metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json'` controls consolidated
  metadata discovery. `auto` probes Zarr v3 and v2 names.
- `labels?: string[]` overrides dimension labels when the array and OME metadata do not provide
  them.
- `requireConsolidatedMetadata?: boolean` requires a consolidated metadata document before the
  image group is opened. Defaults to `true`.

### `omezarr`

- `interleaved?: boolean` controls whether multi-channel results default to one interleaved typed
  array. Defaults to `false`.
- `defaultChannels?: number[]` selects channels when a request omits `channels`.

## API

### `getMetadata(signal?: AbortSignal): Promise<OMEZarrSourceLoaderMetadata>`

Returns image dimensions, dtype, dimension labels, time/z/channel sizes and defaults, native chunk
dimensions, channel display metadata, and available pyramid levels. Each level retains its OME
coordinate transformations when present.

### `getRaster(parameters?: GetOMEZarrParameters): Promise<RasterData>`

Loads one complete 2D plane from a pyramid level. OME-Zarr multiscale metadata is also exposed
through the common `ScanQueryMetadataProvider` interface (`source.getQueryMetadata()`), allowing
source-neutral scan UIs to discover the available levels without reading pixel chunks.

- `level?: number | 'auto'` selects a level explicitly, or chooses the smallest level that still
  covers the requested `width` and `height`.
- `width?: number` and `height?: number` provide target display dimensions for `level: 'auto'`.
- `t?: number` selects the time index.
- `z?: number` selects the z index.
- `channels?: number[]` selects one or more channel indices.
- `interleaved?: boolean` overrides the source-level output layout.
- `signal?: AbortSignal` cancels in-flight metadata or chunk requests.

Planar multi-channel results contain one typed array per channel. Interleaved results contain one
typed array with `bandCount` samples per pixel.

When `level` is omitted, level `0` is used for backwards compatibility. `getMetadata().levels`
contains each level's pixel dimensions, dataset path, coordinate transformations, and scale
relative to the full-resolution level.

## Consolidated root discovery

`loadZarrConsolidatedMetadata(url, options?)` loads and normalizes a Zarr v2 or v3 consolidated
metadata document. The result includes `topLevelGroups` and `topLevelArrays`, which applications
can use to browse SpatialData-style roots before opening a specific image group.

## Current scope

The source reads numeric OME-Zarr image planes and pyramids. It does not yet normalize SpatialData
tables, points, shapes, or coordinate systems into loaders.gl data sources.
