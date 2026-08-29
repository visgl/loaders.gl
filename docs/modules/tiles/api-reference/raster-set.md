---
title: RasterSet
description: Manage viewport-driven raster requests through a raster source.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles module · raster runtime"
  title="RasterSet"
  description="A small loading manager for viewport-driven raster sources, with metadata loading, debounced requests, lifecycle callbacks, and CRS-aware view state."
  tone="cyan"
  meta={['Experimental', 'Raster sources', 'Viewport-driven']}
  links={[
    {label: 'Tiles module', to: '/docs/modules/tiles'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<DocOrientation
  eyebrow="The raster boundary"
  title="Load only the raster view the application asks for."
  description="RasterSet keeps source metadata and viewport-driven raster requests in one small lifecycle, so layers and examples can subscribe to progress without owning request coordination."
  tone="cyan"
  items={[
    {label: 'Metadata', value: 'Load source information once'},
    {label: 'Viewport', value: 'Request raster data for a view'},
    {label: 'Scheduling', value: 'Debounce and optionally refetch'},
    {label: 'Events', value: 'Subscribe to metadata and raster loads'}
  ]}
/>

<ReferenceBoundary
  title="RasterSet reference"
  description="The sections below document construction, source integration, request options, callbacks, and CRS considerations."
  tone="cyan"
/>

`RasterSet` is a lightweight loading manager for viewport-driven [`RasterSource`](/docs/developer-guide/using-sources) implementations.

It wraps `getMetadata()` and `getRaster()` calls, tracks loading state, debounces viewport updates,
and emits lifecycle callbacks that examples and layers can subscribe to.

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
difference between native raster CRS metadata and raster reprojection or resampling.

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

The returned `RasterSet` infers the source's raster data, request, and metadata types. This lets a
GeoZarr source preserve named selections such as `selection: {time: 6}` through request callbacks,
refetch policies, and the accepted `currentRequest`, while GeoTIFF callers continue to use the
common `bands` and `interleaved` parameters.

### `loadMetadata(): Promise<MetadataT>`

Loads and caches source metadata.

### `requestRaster(parameters: ParametersT, debounceTime?): number`

Schedules a viewport-driven raster request and returns the assigned request id.

`GetRasterParameters.selection` optionally maps non-spatial dimension names to integer indices.
Individual sources define the supported names and may expose a narrower request type.

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

- `metadata: MetadataT | null`
- `raster: DataT | null`
- `currentRequest: RasterSetRequest<DataT, ParametersT> | null`
- `rasterSource: RasterSource<DataT, ParametersT, MetadataT> | null`
- `isLoaded: boolean`
