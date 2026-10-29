---
title: GeoZarrSourceLoader
description: Query GeoZarr arrays as geospatial rasters while preserving dimensions, chunks, and CRS metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="zarr"
  eyebrow="GeoZarr source"
  title="Ask a multidimensional array for a spatial slice."
  description="GeoZarrSourceLoader maps GeoZarr and CF/xarray metadata to raster requests, selecting variables, dimensions, levels, and chunks without discarding the array’s native meaning."
  tone="pink"
  meta={['Zarr v2 and v3', 'GeoZarr and CF', 'Chunk-selected raster']}
  links={[
    {label: 'Zarr format', to: '/docs/modules/scientific/zarr/formats/zarr'},
    {label: 'Zarr module', to: '/docs/modules/scientific/zarr'}
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
  `grid_mapping` variable when present. A GDAL `GeoTransform` attribute on that grid-mapping
  variable, as GDAL and rioxarray write it, is used before the coordinate variables and needs no
  coordinate chunk reads. Coordinate and grid-mapping variables are looked up in the data array's
  own group first and then in each ancestor group, as in CF search by proximity.

<ReferenceBoundary
  title="GeoZarr source usage"
  description="The sections below cover metadata conventions, source construction, viewport requests, selections, and chunk access."
  tone="pink"
/>

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {GeoZarrSourceLoader} from '@loaders.gl/scientific/zarr';

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

## Spatial multiscale chunk grids

`getMetadata().tileGrid` describes the selected array's spatial storage chunks. Generic
[Zarr multiscales v0.1](https://github.com/zarr-conventions/multiscales/blob/v0.1/README.md)
`multiscales.layout` entries can describe direct arrays or groups containing the same variable
path. `levels` preserves each asset ID, array path, dimensions, non-spatial selections, and
resolved native metadata. Array dimensions determine logical X/Y independently of physical order.

OME-NGFF `multiscales[].datasets[]` (v0.4 at the group root, v0.5 under `ome`) also describe
levels, but only when the selected array declares a CRS through `proj:*` metadata or a CF
`grid_mapping`. Each level is then georeferenced by its own GeoZarr or CF metadata, as above. The
OME `scale` transforms, composed dataset first and then multiscale, may use a frame other than
the CRS, so only their ratios between levels are checked: a level whose cell-size ratio to the
selected level differs from its scale ratio keeps no metadata, so no complete grid is published.
`translation` transforms are ignored; any other transform type rejects discovery.

A complete `tileMatrixSet` requires a common string CRS and explicit, finite, rightward,
axis-aligned affine geometry for every level. CRS coordinates determine resolution units.
Each level must declare its own absolute `spatial:transform`, on its array, level group, or
layout entry; relative-only transformation graphs are not evaluated. Unsupported levels remain
advertised without complete grid geometry. Unsafe or duplicate asset paths reject discovery.
Node registration shifts to pixel corners; south-up arrays use bottom-left origins.

Chunk matrices include padded edge chunks. Valid raster extent remains in each level's
`metadata.boundingBox`. A storage chunk may include multiple time/channel/depth samples: it is
not a decoded display tile or a standalone 2D payload. `getRaster()` continues to read the
configured `geozarr.array` and named selection; it does not automatically select an overview.
To read another advertised level, create a source with that level's `array` path. Sibling grid
discovery reuses the validated parent group/store and consolidated preflight, and reads
metadata only without decoding coordinate or sample chunks. Non-CRS `proj:*` fields retain
the inherited CRS; an explicit nearer CRS declaration replaces inherited alternatives.

OME-Zarr microscopy coordinates remain native OME metadata. Without a declared CRS, an OME
`multiscales` array is not read as spatial levels, and OME transforms never establish a
geographic CRS or georeferencing. Use the OME source for
its existing image/selection APIs. See [Tile matrices](/docs/developer-guide/tile-matrices).

Explicit `proj:epsg` integer identifiers normalize to `EPSG:<code>`. `proj:projjson` definitions
are retained as structured `metadata.crs` values, without semantic rewriting or identifier-only
reduction. A structured CRS therefore keeps native metadata but omits complete `TileMatrixSet`
geometry, whose current CRS contract is a string. An inherited string CRS never substitutes
for a different explicit child declaration.

When a scope declares both a string CRS and PROJJSON, native raster requests use the string CRS;
the full PROJJSON remains in the raw attributes. PROJJSON-only sources retain structured metadata
and support native windows without a viewport CRS. A string viewport CRS is not assumed equivalent
to a structured definition; supply an explicit `geozarr.coordinateReferenceSystem` string when that
identity is known. No CRS equivalence or reprojection is inferred from a PROJJSON identifier.
