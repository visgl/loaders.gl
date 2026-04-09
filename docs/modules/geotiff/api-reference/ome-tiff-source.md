# OMETiffSource

:::caution
Experimental
:::

The `OMETiffSource` reads OME-TIFF pixel pyramids and returns the same `TiffPixelSource`
objects used by `loadGeoTiff()`. Use `GeoTIFFSource` for georeferenced map rasters and
Cloud-Optimized GeoTIFFs; use `OMETiffSource` for microscopy images with OME dimensions
such as time, channel, z, and pyramid resolution.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {OMETiffSource} from '@loaders.gl/geotiff';

const source = createDataSource(url, [OMETiffSource]);

const metadata = await source.getMetadata();
const pixelSources = await source.getPixelSources();

const raster = await source.getRaster({
  resolution: 0,
  selection: {t: 0, c: 0, z: 0}
});

const tile = await source.getTile({
  resolution: 0,
  x: 0,
  y: 0,
  selection: {t: 0, c: 0, z: 0}
});
```

## Methods

### `getMetadata(): Promise<Record<string, unknown>>`

Returns OME-XML metadata parsed from the first OME image.

### `getPixelSources(): Promise<readonly TiffPixelSource<string[]>[]>`

Returns one `TiffPixelSource` for each available pyramid resolution.

### `getRaster(parameters): Promise<PixelData>`

Reads one 2D raster plane from a pyramid resolution. `parameters.selection` selects the
non-spatial OME dimensions and `parameters.resolution` defaults to `0`.

### `getTile(parameters): Promise<PixelData>`

Reads one pixel tile from a pyramid resolution. The `x` and `y` parameters are pixel-tile
coordinates inside that resolution; they are not Web Mercator tile coordinates.

## Batched range reads

Remote URL sources use the same batched byte-range transport as `GeoTIFFSource`. Calls made
inside the `tileRangeRequest.batchDelayMs` window can share coalesced HTTP range requests.

See the [multi-range loading guide](../../../developer-guide/multi-range-loading.md) for the
shared scheduler model and option tradeoffs.

## Options

| Option                                | Type     | Default | Description                                                                |
| ------------------------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `tileRangeRequest.batchDelayMs`       | `number` | `50`    | Time to wait for sibling range requests before issuing transport requests. |
| `tileRangeRequest.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby pixel tiles. |
| `tileRangeRequest.maxGapBytes`        | `number` | `65536` | Compatibility alias for `rangeExpansionBytes`.                             |
| `tileRangeRequest.maxMergedBytes`     | `number` | `8388608` | Maximum size of one merged byte-range request.                           |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                    |
