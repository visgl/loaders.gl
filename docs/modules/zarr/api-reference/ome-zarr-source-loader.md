# OMEZarrSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`OMEZarrSourceLoader` creates a non-geospatial source for OME-Zarr v2 and v3 image pyramids.
It uses the independent [zarrita.js project](https://github.com/manzt/zarrita.js), documented at
[zarrita.dev](https://zarrita.dev/), for Zarr store access and chunk decoding; loaders.gl
adds the source lifecycle, metadata normalization, cancellation, and raster result contract.

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
const raster = await source.getRaster({level: 0, t: 0, z: 0});
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

Loads one complete 2D plane from a pyramid level.

- `level?: number` selects the zero-based pyramid level.
- `t?: number` selects the time index.
- `z?: number` selects the z index.
- `channels?: number[]` selects one or more channel indices.
- `interleaved?: boolean` overrides the source-level output layout.
- `signal?: AbortSignal` cancels in-flight metadata or chunk requests.

Planar multi-channel results contain one typed array per channel. Interleaved results contain one
typed array with `bandCount` samples per pixel.

## Consolidated root discovery

`loadZarrConsolidatedMetadata(url, options?)` loads and normalizes a Zarr v2 or v3 consolidated
metadata document. The result includes `topLevelGroups` and `topLevelArrays`, which applications
can use to browse SpatialData-style roots before opening a specific image group.

## Current scope

The source reads numeric OME-Zarr image planes and pyramids. It does not yet normalize SpatialData
tables, points, shapes, or coordinate systems into loaders.gl data sources.
