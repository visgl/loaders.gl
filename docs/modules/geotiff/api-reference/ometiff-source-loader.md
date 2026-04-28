import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';

# OMETiffSourceLoader

<GeoTiffDocsTabs active="ometiffsource" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
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
