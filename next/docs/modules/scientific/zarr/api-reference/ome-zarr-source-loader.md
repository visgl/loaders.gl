Zarr API / bioimaging

![](/next/images/format-logos/zarr-logo.svg)

# Read an image pyramid at the level and channels you need.

OMEZarrSourceLoader discovers OME image metadata, resolves multiscale arrays, and reads selected raster windows from local or remote stores without flattening the entire pyramid first.

[Zarr module](https://loaders.gl/next/docs/modules/scientific/zarr.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/zarr.md)[OME-Zarr example](https://loaders.gl/next/examples/bioimaging/ome-zarr)

<!-- -->

[ ↗](https://loaders.gl/next/examples/bioimaging/ome-zarr)[GeoZarr source](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md)

Image-pyramid source

## Discover dimensions, then request a view.

OME-Zarr describes channels, dimensions, scales, and image groups separately from the chunks that store pixels. The source keeps those choices explicit in the metadata and raster request.

01

Discover

Read OME metadata, dimensions, channels, and pyramid levels.

02

Select

Choose level, time, depth, channels, and output size.

03

Read

Fetch only the chunks covering the requested raster.

04

Render

Return typed raster data for the application or visualization layer.

Detailed guide

## OME-Zarr source reference

The detailed reference covers store discovery, metadata options, dimension selection, channel handling, and raster output.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`OMEZarrSourceLoader` creates a non-geospatial source for OME-Zarr v2 and v3 image pyramids.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {OMEZarrSourceLoader} from '@loaders.gl/scientific/zarr';



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

## Source options[​](#source-options "Direct link to Source options")

### `zarr`[​](#zarr "Direct link to zarr")

* `path?: string | null` selects an image group below the store root.
* `metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json'` controls consolidated metadata discovery. `auto` probes Zarr v3 and v2 names.
* `labels?: string[]` overrides dimension labels when the array and OME metadata do not provide them.
* `requireConsolidatedMetadata?: boolean` requires a consolidated metadata document before the image group is opened. Defaults to `true`.

### `omezarr`[​](#omezarr "Direct link to omezarr")

* `interleaved?: boolean` controls whether multi-channel results default to one interleaved typed array. Defaults to `false`.
* `defaultChannels?: number[]` selects channels when a request omits `channels`.

## API[​](#api "Direct link to API")

### `getMetadata(signal?: AbortSignal): Promise<OMEZarrSourceLoaderMetadata>`[​](#getmetadatasignal-abortsignal-promiseomezarrsourceloadermetadata "Direct link to getmetadatasignal-abortsignal-promiseomezarrsourceloadermetadata")

Returns image dimensions, dtype, dimension labels, time/z/channel sizes and defaults, native chunk dimensions, channel display metadata, and available pyramid levels. Each level retains its OME coordinate transformations when present.

### `getRaster(parameters?: GetOMEZarrParameters): Promise<RasterData>`[​](#getrasterparameters-getomezarrparameters-promiserasterdata "Direct link to getrasterparameters-getomezarrparameters-promiserasterdata")

Loads one complete 2D plane from a pyramid level. OME-Zarr multiscale metadata is also exposed through the common `ScanQueryMetadataProvider` interface (`source.getQueryMetadata()`), allowing source-neutral scan UIs to discover the available levels without reading pixel chunks.

* `level?: number | 'auto'` selects a level explicitly, or chooses the smallest level that still covers the requested `width` and `height`.
* `width?: number` and `height?: number` provide target display dimensions for `level: 'auto'`.
* `t?: number` selects the time index.
* `z?: number` selects the z index.
* `channels?: number[]` selects one or more channel indices.
* `interleaved?: boolean` overrides the source-level output layout.
* `signal?: AbortSignal` cancels in-flight metadata or chunk requests.

Planar multi-channel results contain one typed array per channel. Interleaved results contain one typed array with `bandCount` samples per pixel.

When `level` is omitted, level `0` is used for backwards compatibility. `getMetadata().levels` contains each level's pixel dimensions, dataset path, coordinate transformations, and scale relative to the full-resolution level.

## Consolidated root discovery[​](#consolidated-root-discovery "Direct link to Consolidated root discovery")

`loadZarrConsolidatedMetadata(url, options?)` loads and normalizes a Zarr v2 or v3 consolidated metadata document. The result includes `topLevelGroups` and `topLevelArrays`, which applications can use to browse SpatialData-style roots before opening a specific image group.

## Current scope[​](#current-scope "Direct link to Current scope")

The source reads numeric OME-Zarr image planes and pyramids. It does not yet normalize SpatialData tables, points, shapes, or coordinate systems into loaders.gl data sources.

### TileMatrix compatibility[​](#tilematrix-compatibility "Direct link to TileMatrix compatibility")

OME spatial axes and physical units alone do not establish a geographic CRS. The OME source retains native level and channel/time/depth metadata rather than inventing a `TileMatrixSet`. Explicitly georeferenced generic Zarr multiscales are supported by [GeoZarrSourceLoader](https://loaders.gl/next/docs/modules/scientific/zarr/api-reference/geo-zarr-source-loader.md).
