# GeoTIFFSource

:::caution
Experimental
:::

The `GeoTIFFSource` reads image windows and tiles from GeoTIFF and Cloud-Optimized GeoTIFF
files. Remote URL sources use HTTP range requests and automatically coalesce nearby byte
ranges.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {GeoTIFFSource} from '@loaders.gl/geotiff';

const source = createDataSource(url, [GeoTIFFSource]);

const image = await source.getImage({
  boundingBox: [[-123, 37], [-122, 38]],
  width: 512,
  height: 512,
  layers: []
});
```

`GeoTIFFSource` also implements the tile-source API:

```typescript
const tile = await source.getTile({x: 0, y: 0, z: 0});
const tilePromises = source.getTileDataBatch?.([tileA, tileB, tileC]);
```

## Batched range reads

`getImage()`, `getTile()`, and `getTileData()` read through the same range-request
transport. Requests made during the same `tileRangeRequest.batchDelayMs` window are sorted
by byte offset; nearby byte ranges are fetched as one merged HTTP `Range` request and sliced
back into the independent image/tile promises.

See the [multi-range loading guide](../../../developer-guide/multi-range-loading.md) for the
shared scheduler model and option tradeoffs.

## Options

| Option                                | Type      | Default | Description                                                                 |
| ------------------------------------- | --------- | ------- | --------------------------------------------------------------------------- |
| `geotiff.enableAlpha`                 | `boolean` | `true`  | Include an alpha channel when `geotiff.js` can read one.                    |
| `geotiff.tileSize`                    | `number`  | `512`   | Pixel width and height for `getTile()` and `getTileData()`.                 |
| `tileRangeRequest.batchDelayMs`       | `number`  | `50`    | Time to wait for sibling range requests before issuing transport requests.  |
| `tileRangeRequest.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby raster tile content. |
| `tileRangeRequest.maxGapBytes`        | `number`  | `65536` | Compatibility alias for `rangeExpansionBytes`.                              |
| `tileRangeRequest.maxMergedBytes`     | `number`  | `8388608` | Maximum size of one merged byte-range request.                            |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                     |

## Limitations

- The initial source targets north-up GeoTIFF / COG rasters.
- `getTile()` uses Web Mercator z/x/y tile bounds expressed as longitude/latitude.
- Arbitrary CRS reprojection, rotated/sheared affine transforms, and multi-file overview
  URLs are not handled by this source yet.
- The older `GeoTIFFLoader`, `loadGeoTiff()`, and `TiffPixelSource` APIs are still available.
- OME-TIFF microscopy pixel pyramids are exposed through `OMETiffSource` instead of this
  map-raster source.
