Tiles module · raster runtime

# RasterSet

A small loading manager for viewport-driven raster sources, with metadata loading, debounced requests, lifecycle callbacks, and CRS-aware view state.

[Tiles module](https://loaders.gl/next/docs/modules/tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

The raster boundary

## Load only the raster view the application asks for.

RasterSet keeps source metadata and viewport-driven raster requests in one small lifecycle, so layers and examples can subscribe to progress without owning request coordination.

01

Metadata

Load source information once

02

Viewport

Request raster data for a view

03

Scheduling

Debounce and optionally refetch

04

Events

Subscribe to metadata and raster loads

Detailed guide

## RasterSet reference

The sections below document construction, source integration, request options, callbacks, and CRS considerations.

`RasterSet` is a lightweight loading manager for viewport-driven [`RasterSource`](https://loaders.gl/next/docs/developer-guide/using-sources.md) implementations.

It wraps `getMetadata()` and `getRaster()` calls, tracks loading state, debounces viewport updates, and emits lifecycle callbacks that examples and layers can subscribe to.

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the difference between native raster CRS metadata and raster reprojection or resampling.

## Usage[​](#usage "Direct link to Usage")

```
import {RasterSet} from '@loaders.gl/tiles';

import {createDataSource} from '@loaders.gl/core';

import {GeoTIFFSourceLoader} from '@loaders.gl/raster/geotiff/geotiff-source-loader';



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

## API[​](#api "Direct link to API")

### `new RasterSet(options)`[​](#new-rastersetoptions "Direct link to new-rastersetoptions")

Creates a raster manager from either:

* `rasterSource`
* or explicit `getMetadata` and `getRaster` callbacks

Supported options include:

* `debounceTime?: number`
* `shouldRefetch?: (args) => boolean`

### `RasterSet.fromRasterSource(rasterSource, options?)`[​](#rastersetfromrastersourcerastersource-options "Direct link to rastersetfromrastersourcerastersource-options")

Convenience factory for wrapping a loaders.gl `RasterSource`.

The returned `RasterSet` infers the source's raster data, request, and metadata types. This lets a GeoZarr source preserve named selections such as `selection: {time: 6}` through request callbacks, refetch policies, and the accepted `currentRequest`, while GeoTIFF callers continue to use the common `bands` and `interleaved` parameters.

### `loadMetadata(): Promise<MetadataT>`[​](#loadmetadata-promisemetadatat "Direct link to loadmetadata-promisemetadatat")

Loads and caches source metadata.

### `requestRaster(parameters: ParametersT, debounceTime?): number`[​](#requestrasterparameters-parameterst-debouncetime-number "Direct link to requestrasterparameters-parameterst-debouncetime-number")

Schedules a viewport-driven raster request and returns the assigned request id.

`GetRasterParameters.selection` optionally maps non-spatial dimension names to integer indices. Individual sources define the supported names and may expose a narrower request type.

### `subscribe(listener): () => void`[​](#subscribelistener---void "Direct link to subscribelistener---void")

Registers lifecycle callbacks and returns an unsubscribe function.

Available callbacks include:

* `onLoadingStateChange`
* `onMetadataLoad`
* `onMetadataLoadError`
* `onRasterLoadStart`
* `onRasterLoad`
* `onRasterLoadError`
* `onUpdate`

### Properties[​](#properties "Direct link to Properties")

* `metadata: MetadataT | null`
* `raster: DataT | null`
* `currentRequest: RasterSetRequest<DataT, ParametersT> | null`
* `rasterSource: RasterSource<DataT, ParametersT, MetadataT> | null`
* `isLoaded: boolean`
