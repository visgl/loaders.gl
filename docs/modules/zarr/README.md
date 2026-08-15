# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

The `@loaders.gl/zarr` module reads chunked, multidimensional [Zarr](https://zarr.dev/)
arrays. It supports the existing pixel-pyramid API, an OME-Zarr source API for bioimaging, and a
GeoZarr/CF source API for georeferenced Earth-science rasters.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/zarr
```

## APIs

- [`OMEZarrSourceLoader`](/docs/modules/zarr/api-reference/ome-zarr-source-loader) opens OME-Zarr
  v2 and v3 image groups through `createDataSource()` or `load()`.
- [`GeoZarrSourceLoader`](/docs/modules/zarr/api-reference/geo-zarr-source-loader) opens one
  georeferenced Zarr data variable and reads native spatial windows with named time, vertical, or
  band selections.
- `loadZarrConsolidatedMetadata()` probes `.zmetadata`, `zmetadata`, and `zarr.json` documents and
  reports top-level arrays and groups.
- `loadZarr()` and `ZarrPixelSource` provide the legacy Zarr v2 pixel-pyramid API.

## Example

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/spatialdata.zarr', [OMEZarrSourceLoader], {
  zarr: {path: 'images/example-image'}
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({level: 0, channels: [0, 1, 2]});
```

The [OME-Zarr example](/examples/bioimaging/ome-zarr) demonstrates browsing a SpatialData-style
root and selecting an image pyramid.

For climate, weather, ocean, satellite, and other Earth-science stores, use
`GeoZarrSourceLoader`. It recognizes the current GeoZarr `proj:` and `spatial:` conventions as
well as the regular one-dimensional coordinate arrays commonly written by xarray/CF workflows.
The [GeoZarr deck.gl example](/examples/geospatial/geo-zarr) reads a public NASA POWER climatology
store directly from S3 and renders monthly solar irradiance on an interactive map.

## Attributions

The OME-Zarr source uses [zarrita.js](https://zarrita.dev/) under the MIT license. The legacy Zarr
v2 API wraps [zarr.js](https://github.com/gzuidhof/zarr.js/) under the MIT license.
