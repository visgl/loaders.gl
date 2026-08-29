---
title: GeoZarrSourceLoader
description: Query GeoZarr arrays as geospatial rasters while preserving dimensions, chunks, and CRS metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoZarr source"
  title="Ask a multidimensional array for a spatial slice."
  description="GeoZarrSourceLoader maps GeoZarr and CF/xarray metadata to raster requests, selecting variables, dimensions, levels, and chunks without discarding the array’s native meaning."
  tone="pink"
  meta={['Zarr v2 and v3', 'GeoZarr and CF', 'Chunk-selected raster']}
  links={[
    {label: 'Zarr format', to: '/docs/modules/zarr/formats/zarr'},
    {label: 'Zarr module', to: '/docs/modules/zarr'}
  ]}
/>

<DocOrientation
  eyebrow="The multidimensional request"
  title="Select the variable, dimensions, and window."
  description="The source discovers array and coordinate metadata, derives a spatial transform when possible, and reads the chunks that cover the requested view and named slices."
  tone="pink"
  items={[
    {label: 'Discover', value: 'Variables, dimensions, CRS, and transforms'},
    {label: 'Select', value: 'Array path, time, level, channel, or slice'},
    {label: 'Read', value: 'Only chunks intersecting the request'},
    {label: 'Return', value: 'Typed raster data with dimension metadata'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`GeoZarrSourceLoader` opens a numeric Zarr data variable as a viewport-driven geospatial raster
source. It supports Zarr v2 and v3 stores through Zarrita.

The source recognizes two interoperable metadata patterns:

- GeoZarr `proj:code` / `proj:wkt2`, `spatial:dimensions`, `spatial:transform`, `spatial:bbox`, and
  `spatial:registration` attributes.
- Regular one-dimensional CF/xarray longitude/latitude or x/y coordinate variables. The source
  derives an affine transform when those coordinates are evenly spaced and reads CRS WKT from a CF
  `grid_mapping` variable when present.

<ReferenceBoundary
  title="GeoZarr source usage"
  description="The sections below cover metadata conventions, source construction, viewport requests, selections, and chunk access."
  tone="pink"
/>

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {GeoZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/reanalysis.zarr', [GeoZarrSourceLoader], {
  zarr: {
    path: null,
    requireConsolidatedMetadata: true
  },
  geozarr: {
    array: 'air_temperature',
    defaultSelection: {time: 0, level: 0}
  }
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({
  viewport,
  selection: {time: 24, level: 3}
});
```

## Source options

### `zarr`

- `path?: string | null` selects the group that contains the data and coordinate variables.
- `metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json'` controls consolidated
  metadata discovery.
- `requireConsolidatedMetadata?: boolean` requires a consolidated metadata document before the
  group is opened. Defaults to `true`; set it to `false` for unconsolidated stores.

### `geozarr`

- `array: string` selects the numeric data variable relative to `zarr.path`.
- `spatialDimensions?: [y: string, x: string]` overrides GeoZarr metadata and common CF dimension
  names.
- `transform?: [a, b, c, d, e, f]` supplies Rasterio/Affine coefficients when the store does not
  provide a transform or regular coordinate variables.
- `coordinateReferenceSystem?: string` supplies an authority identifier or WKT when the store does
  not provide one.
- `defaultSelection?: Record<string, number>` supplies default indices for non-spatial dimensions.

## API

### `getMetadata(): Promise<GeoZarrSourceMetadata>`

Returns normalized raster metadata plus:

- `array` and ordered `dimensions`
- logical `[y, x]` `spatialDimensions`
- `selectionDimensions`, including each dimension's size and default index
- a pixel-corner `transform`
- GeoZarr `registration`

`boundingBox`, `crs`, `dtype`, `noData`, and native chunk dimensions use the common loaders.gl
`RasterSourceMetadata` shape.

### `getRaster(parameters: GetGeoZarrParameters): Promise<RasterData>`

Reads the native-resolution array window intersecting `parameters.viewport`.

- `selection?: RasterSelection` selects named non-spatial indices through the common
  `GetRasterParameters` contract.
- `signal?: AbortSignal` cancels metadata and chunk requests.
- `resampleMethod?: 'nearest'` is accepted for API compatibility. Bilinear resampling is not yet
  implemented.

The returned raster contains one typed-array band, exact source-coordinate bounds for the selected
pixel window, and the normalized CRS.

See the [GeoZarr deck.gl example](/examples/geospatial/geo-zarr) for a complete browser workflow
that selects monthly NASA POWER climatology data, colorizes the returned typed raster, and displays
it with deck.gl's `BitmapLayer`.

## Current scope

This first version is intentionally limited to regular, axis-aligned 2D grids with optional named
non-spatial dimensions. It does not yet support reprojection, rotated affine window reads,
curvilinear 2D longitude/latitude coordinates, staggered grids, unstructured meshes, or multiscale
GeoZarr layouts.

The GeoZarr conventions are still pre-stable. The source therefore retains original group and array
attributes in `metadata` and treats unknown optional fields as ignorable.
