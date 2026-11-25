---
title: GeoZarrLoader
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
  description="GeoZarrLoader maps GeoZarr and CF/xarray metadata to raster requests, selecting variables, dimensions, levels, and chunks without discarding the array’s native meaning."
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

`GeoZarrLoader` opens a numeric Zarr data variable as a viewport-driven geospatial raster
source. It supports Zarr v2 and v3 stores through Zarrita.

The source recognizes two interoperable metadata patterns:

- GeoZarr `proj:code` / `proj:wkt2`, `spatial:dimensions`, `spatial:transform`, `spatial:bbox`, and
  `spatial:registration` attributes.
- Regular one-dimensional CF/xarray longitude/latitude or x/y coordinate variables. The source
  derives an affine transform when those coordinates are evenly spaced. It checks the data array's
  group first and then its ancestors up to the selected group when resolving coordinates and a
  named CF `grid_mapping` variable. If the named mapping is absent, it tries a sibling
  `spatial_ref` variable. GDAL and rioxarray can provide a pixel-corner `GeoTransform`
  on the mapping variable. A sibling's `GeoTransform` takes precedence over regular coordinates
  and requires no coordinate chunk reads. An ancestor mapping supplies the CRS only. Errors
  reading an existing CF variable are surfaced to the caller.

Without an explicit override or a GeoZarr `proj:` CRS, the source checks the mapping's
`crs_wkt` and `spatial_ref` attributes, then the group-level `crs` attribute. WKT with an
outer EPSG authority becomes an `EPSG:<code>` identifier. WKT without an outer EPSG authority
is preserved in `metadata.crs`.

<ReferenceBoundary
  title="GeoZarr source usage"
  description="The sections below cover metadata conventions, source construction, viewport requests, selections, and chunk access."
  tone="pink"
/>

| Property | Value |
| --- | --- |
| Data source | `GeoZarrRasterSource` |

## Usage

```ts
import {createDataSourceSync} from '@loaders.gl/core';
import {GeoZarrLoader} from '@loaders.gl/scientific/zarr';

const source = createDataSourceSync('https://example.com/reanalysis.zarr', [GeoZarrLoader], {
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

- `array: string` selects the numeric data variable relative to `zarr.path`. A bare variable
  name such as `'backscatter'` can also open the first dataset of a group-per-level pyramid,
  which is advertised finest first.
- `spatialDimensions?: [y: string, x: string]` overrides GeoZarr metadata and common CF dimension
  names.
- `transform?: [a, b, c, d, e, f]` supplies Rasterio/Affine coefficients when the store does not
  provide a transform or regular coordinate variables.
- `coordinateReferenceSystem?: string` supplies an authority identifier or WKT when the store does
  not provide one.
- `defaultSelection?: Record<string, number>` supplies default indices for non-spatial dimensions.
- `fillValueAsNoData?: boolean` controls the fallback to a finite Zarr `fill_value`. It defaults
  to `true` for integer arrays and `false` for floating-point arrays. A storage fill value may
  represent valid data. CF `_FillValue` and then `missing_value` take precedence over this option.
- `maxConcurrentRequests?: number` caps simultaneous Zarrita store reads per source, including
  chunk response bodies and byte-range reads. Defaults to `16`.

## API

### `getMetadata(): Promise<GeoZarrSourceMetadata>`

Returns normalized raster metadata plus:

- `array` and ordered `dimensions`
- logical `[y, x]` `spatialDimensions`
- `selectionDimensions`, including each dimension's size and default index
- a pixel-corner `transform`
- GeoZarr `registration`
- `levels` with each advertised level's array path and resolved metadata, including width, height,
  transform, and CRS

`boundingBox`, `crs`, `dtype`, `noData`, and native chunk dimensions use the common loaders.gl
`RasterSourceMetadata` shape. Nodata is also exposed in the band metadata.

### `getRaster(parameters: GetGeoZarrParameters): Promise<RasterData>`

Reads a native-resolution array window intersecting `parameters.viewport`. The source divides
the requested bounds' width and height by the respective viewport dimensions and uses the smaller
value as the target pixel size. It selects the coarsest compatible level with pixels no larger
than that target on either axis. The configured array is the fallback and the finest candidate.

- `selection?: RasterSelection` selects named non-spatial indices through the common
  `GetRasterParameters` contract.
- `signal?: AbortSignal` cancels metadata and chunk requests.
- `resampleMethod?: 'nearest'` is accepted for API compatibility. Bilinear resampling is not yet
  implemented.

The returned raster contains one typed-array band, exact source-coordinate bounds, and an affine
transform whose origin is the first pixel corner of the returned window. `overview` gives the
index in `levels` and `metadata.array` identifies the array that supplied the samples.

See the [GeoZarr deck.gl example](/examples/geospatial/geo-zarr) for a complete browser workflow
that selects monthly NASA POWER climatology data, colorizes the returned typed raster, and displays
it with deck.gl's `BitmapLayer`.

## Current scope

Window reads support regular, axis-aligned 2D grids in the source CRS, with optional named
non-spatial dimensions. Overview selection returns native samples at the selected resolution.

The GeoZarr conventions are still pre-stable. The source therefore retains original group and array
attributes in `metadata` and treats unknown optional fields as ignorable.

## Spatial multiscale chunk grids

`getMetadata().tileGrid` describes the selected array's spatial storage chunks. Generic
[Zarr multiscales v0.1](https://github.com/zarr-conventions/multiscales/blob/v0.1/README.md)
`multiscales.layout` entries can describe direct arrays or groups containing the same variable
path. `levels` preserves each asset ID, array path, dimensions, non-spatial selections, and
resolved native metadata. Array dimensions determine logical X/Y independently of physical order.

OME-NGFF `multiscales[].datasets[]` can also give the levels. Version 0.4 puts them at the group
root, and version 0.5 puts them under `ome`. xarray pyramids can use the v0.4 structure with a
group per dataset path, a common data variable in each group, and optional `axes` and
`coordinateTransformations`. Regular CF coordinates can establish a level's geometry
when an xarray layout omits axes.

The source georeferences each OME-NGFF level with the GeoZarr or CF metadata of that level, as
above. When named axes and transformations are present, the source uses OME `scale` transforms
to check relative resolution. Each level's GeoZarr or CF metadata supplies its absolute
georeferencing.

- The source multiplies the dataset scale first, then the multiscale scale.
- For each level, the cell-size ratio to the selected level must equal the OME scale ratio.
- If a level fails the check, the source removes the metadata of that level. Then the source does
  not publish a complete grid.

The source ignores `identity` and `translation` transforms. It rejects all other transform types.

A complete `tileMatrixSet` requires a common string CRS and finite, rightward, axis-aligned affine
geometry for every level. CRS coordinates determine resolution units. Each level uses its own
absolute geometry from its array, level group, layout entry, or CF coordinates. Unsupported
levels remain advertised without complete grid geometry. Unsafe or duplicate asset paths reject
discovery. Node registration shifts to pixel corners. South-up arrays use bottom-left origins.

Chunk matrices include padded edge chunks. Valid raster extent remains in each level's
`metadata.boundingBox`. A storage chunk may include multiple time/channel/depth samples: it is
not a decoded display tile or a standalone 2D payload. Sibling grid discovery reuses the parent
store and consolidated preflight. It reads coordinate chunks when they are needed to derive
an affine. Non-CRS `proj:*` fields retain the inherited CRS. An explicit nearer CRS declaration
replaces inherited alternatives.

For OME layouts with named axes, GeoZarr requires a CRS declaration on the selected array,
enclosing group, or CF grid mapping. The OME source handles native microscopy coordinates
through its image and selection APIs. See [Tile matrices](/docs/developer-guide/tile-matrices).

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
