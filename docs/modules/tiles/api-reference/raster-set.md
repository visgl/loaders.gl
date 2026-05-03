# RasterSet

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`RasterSet` is a lightweight loading manager for viewport-driven [`RasterSource`](/docs/developer-guide/using-sources) implementations.

It wraps `getMetadata()` and `getRaster()` calls, tracks loading state, debounces viewport updates,
and emits lifecycle callbacks that examples and layers can subscribe to.

## Usage

```ts
import {RasterSet} from '@loaders.gl/tiles';
import {createDataSource} from '@loaders.gl/core';
import {GeoTIFFSourceLoader} from '@loaders.gl/geotiff';

const rasterSource = createDataSource('example.tif', [GeoTIFFSourceLoader], {
  core: {type: 'geotiff'}
});

const rasterSet = RasterSet.fromRasterSource(rasterSource, {
  debounceTime: 120
});

rasterSet.subscribe({
  onMetadataLoad: metadata => console.log(metadata),
  onRasterLoad: request => console.log(request.raster)
});

await rasterSet.loadMetadata();
rasterSet.requestRaster({
  viewport: {
    id: 'main',
    width: 1024,
    height: 768,
    zoom: 5,
    center: [-27.2, 38.9],
    crs: 'EPSG:4326',
    getBounds: () => [-33.4, 37.0, -20.9, 41.0],
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], 0]
  }
});
```

## API

### `new RasterSet(options)`

Creates a raster manager from either:

- `rasterSource`
- or explicit `getMetadata` and `getRaster` callbacks

Supported options include:

- `debounceTime?: number`
- `shouldRefetch?: (args) => boolean`

### `RasterSet.fromRasterSource(rasterSource, options?)`

Convenience factory for wrapping a loaders.gl `RasterSource`.

### `loadMetadata(): Promise<RasterSourceMetadata>`

Loads and caches source metadata.

### `requestRaster(parameters: GetRasterParameters, debounceTime?): number`

Schedules a viewport-driven raster request and returns the assigned request id.

### `subscribe(listener): () => void`

Registers lifecycle callbacks and returns an unsubscribe function.

Available callbacks include:

- `onLoadingStateChange`
- `onMetadataLoad`
- `onMetadataLoadError`
- `onRasterLoadStart`
- `onRasterLoad`
- `onRasterLoadError`
- `onUpdate`

### Properties

- `metadata: RasterSourceMetadata | null`
- `raster: RasterData | null`
- `currentRequest: RasterSetRequest | null`
- `rasterSource: RasterSource | null`
- `isLoaded: boolean`
