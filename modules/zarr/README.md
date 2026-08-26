# @loaders.gl/zarr

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for the Zarr format.

## Implementation

The source-loader APIs in this module use [zarrita.js](https://zarrita.dev/) to open Zarr v2 and
v3 stores, discover metadata, and decode array chunks. loaders.gl provides the `DataSource`,
`RasterSource`, selection, cancellation, and metadata contracts around Zarrita. The legacy
`loadZarr()` pixel-pyramid API continues to use its existing `zarr.js` implementation.

## Exports

- `loadZarr()` and `ZarrPixelSource` for the existing pixel-pyramid API
- `OMEZarrSourceLoader` / `OMEZarrImageSource` for `createDataSource()` and `load()`
- `GeoZarrSourceLoader` / `GeoZarrRasterSource` for georeferenced Zarr data variables
- `loadZarrConsolidatedMetadata()` for probing consolidated Zarr roots

## GeoZarr SourceLoader

`GeoZarrSourceLoader` opens one gridded data variable as a viewport-driven raster source. It reads
the current GeoZarr `proj:` and `spatial:` attributes and falls back to regular one-dimensional CF
coordinate variables used by xarray climate and weather stores.

```ts
import {createDataSource} from '@loaders.gl/core';
import {GeoZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/weather.zarr', [GeoZarrSourceLoader], {
  geozarr: {
    array: 'air_temperature',
    defaultSelection: {time: 0, pressure: 10}
  }
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({
  viewport,
  selection: {time: 12, pressure: 8}
});
```

The first version supports axis-aligned affine grids and native-resolution window reads. It does
not reproject, resample, or handle curvilinear two-dimensional coordinate arrays.

The [GeoZarr deck.gl example](https://loaders.gl/examples/geospatial/geo-zarr) reads NASA POWER
climatology data directly from a public Zarr store and renders it on an interactive map.

## OME-Zarr SourceLoader

`OMEZarrSourceLoader` is the first source-loader abstraction in this module. It is image-first:

- it opens OME-Zarr image or label groups
- it normalizes multiscale metadata
- it reads 2D planes through `getRaster()`
- it requires consolidated metadata by default (`zarr.json`, `.zmetadata`, or `zmetadata`)

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/image.zarr', [OMEZarrSourceLoader], {
  omezarr: {}
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({channels: [0, 1, 2]});
```

## Example: SpatialData-style root browsing

This mirrors the split used in SpatialData.js: first browse consolidated metadata at the store root, then open an image group with the source loader.

```ts
import {createDataSource} from '@loaders.gl/core';
import {loadZarrConsolidatedMetadata, OMEZarrSourceLoader} from '@loaders.gl/zarr';

const rootUrl = 'https://example.com/spatialdata.zarr';
const consolidated = await loadZarrConsolidatedMetadata(rootUrl);

console.log(consolidated.topLevelGroups);
// ['images', 'labels', 'points', 'shapes', 'tables']
console.log(consolidated.topLevelArrays);
// []

const imageSource = createDataSource(rootUrl, [OMEZarrSourceLoader], {
  zarr: {
    path: 'images/example-image'
  },
  omezarr: {}
});

const imageMetadata = await imageSource.getMetadata();
```

See the [`OMEZarrSourceLoader` API reference](https://loaders.gl/docs/modules/zarr/api-reference/ome-zarr-source-loader)
for source options, raster output layout, and current scope.
