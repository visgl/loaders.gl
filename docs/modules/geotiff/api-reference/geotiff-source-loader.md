# GeoTIFFSourceLoader

:::caution
Experimental
:::

![ogc-logo](../../../images/logos/ogc-logo-60.png)

`GeoTIFFSourceLoader` creates a viewport-driven raster source for GeoTIFF and Cloud Optimized GeoTIFF
(COG) datasets.

It accepts 2D viewport requests, loads the nearest source data for that view, and returns typed
CPU-side raster payloads that can be uploaded to textures or colorized client-side.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {GeoTIFFSourceLoader} from '@loaders.gl/geotiff';

const source = createDataSource('example.tif', [GeoTIFFSourceLoader], {
  core: {type: 'geotiff'},
  geotiff: {
    interleaved: false,
    resampleMethod: 'nearest'
  }
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({
  viewport: {
    id: 'main',
    width: 1024,
    height: 768,
    zoom: 4,
    center: [-27.2, 38.9],
    crs: metadata.crs,
    getBounds: () => [-33.4, 37.0, -20.9, 41.0],
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], 0]
  },
  bands: [0],
  interleaved: false
});
```

## Behavior

- Loads GeoTIFF metadata once and exposes source CRS, bounds, band count, dtype, tile size, and overview information through `getMetadata()`.
- Supports URL and `Blob` inputs.
- Uses HTTP byte ranges for remote GeoTIFF access and can integrate with a shared `RangeRequestScheduler`.
- Returns native-projection raster values; reprojection is not performed in v1.
- Rejects viewport requests whose `viewport.crs` does not match the dataset CRS.

## API

### `getMetadata(): Promise<RasterSourceMetadata>`

Returns normalized metadata for the GeoTIFF dataset.

Notable fields include:

- `crs?: string`
- `boundingBox?: [[minX, minY], [maxX, maxY]]`
- `width`, `height`
- `bandCount`
- `dtype`
- `tileSize`
- `overviews`

### `getRaster(parameters: GetRasterParameters): Promise<RasterData>`

Loads raster samples for the requested viewport.

- `viewport` is required and must include either `bounds` or `getBounds()`.
- `bands?: number[]` selects one or more sample bands.
- `interleaved?: boolean` returns one interleaved typed array for multi-band reads.
- `resampleMethod?: 'nearest' | 'bilinear'` selects source-side resampling when supported.
- `signal?: AbortSignal` aborts the underlying request.

The returned `RasterData` contains:

- `data: TypedArray | TypedArray[]`
- `width`, `height`
- `bandCount`
- `dtype`
- `boundingBox`
- `crs`
- `noData`

## Notes

- GeoTIFF overview selection is delegated to `geotiff.js` through `readRasters()`.
- For remote COGs, `GeoTIFFSourceLoader` can share a `RangeRequestScheduler` with other sources to
  coalesce overlapping byte-range requests.
