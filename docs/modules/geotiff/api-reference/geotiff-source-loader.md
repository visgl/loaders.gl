---
title: GeoTIFFSourceLoader
description: Query GeoTIFF and Cloud Optimized GeoTIFF rasters by viewport, window, overview, and band.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {RasterWindowGraphic} from '@site/src/components/docs/raster-window-graphic';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  format="geotiff"
  eyebrow="Cloud raster source"
  title="GeoTIFFSourceLoader"
  description="GeoTIFFSourceLoader discovers raster metadata, selects an overview and band set, and reads only the ranges needed for a viewport or bounded request."
  tone="mint"
  meta={['GeoTIFF and COG', 'Viewport-driven', 'HTTP ranges']}
  links={[
    {label: 'GeoTIFF format', to: '/docs/modules/geotiff/formats/geotiff'},
    {label: 'GeoTIFF module', to: '/docs/modules/geotiff'}
  ]}
/>

<DocLiveExample label="Cloud-optimized GeoTIFF window example" height="440px">
  <ClientExample kind="geotiff" />
</DocLiveExample>

<GeoTiffDocsTabs active="geotiffsource" />

<RasterWindowGraphic kind="geotiff" />

<DocOrientation
  eyebrow="The raster request"
  title="Metadata chooses the read. The viewport supplies the question."
  description="The source uses dimensions, transforms, overviews, and bounds to turn a viewport or raster query into a small typed result."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Dimensions, bands, CRS, bounds, and overviews'},
    {label: 'Select', value: 'Window, resolution, and components'},
    {label: 'Read', value: 'Relevant TIFF or COG byte ranges'},
    {label: 'Return', value: 'Typed CPU-side raster payload'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GeoTIFFSourceLoader` creates a viewport-driven raster source for GeoTIFF and Cloud Optimized GeoTIFF
(COG) datasets.

It accepts 2D viewport requests, loads the nearest source data for that view, and returns typed
CPU-side raster payloads that can be uploaded to textures or colorized client-side.

<ReferenceBoundary
  title="GeoTIFF source usage"
  description="The sections below cover source construction, metadata, viewport requests, raster selection, and cloud range-read behavior."
  tone="mint"
/>

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {GeoTIFFSourceLoader} from '@loaders.gl/geotiff';

const source = createDataSource('example.tif', [GeoTIFFSourceLoader], {
  core: {type: 'geotiff'},
  geotiff: {
    interleaved: false,
    resampleMethod: 'nearest'
  }
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({
  viewport: {
    id: 'main',
    width: 1024,
    height: 768,
    zoom: 4,
    center: [-27.2, 38.9],
    crs: metadata.crs,
    getBounds: () => [-33.4, 37.0, -20.9, 41.0],
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], 0]
  },
  bands: [0],
  interleaved: false
});
```

## Behavior

- Loads GeoTIFF metadata once and exposes source CRS, bounds, band count, dtype, tile size, and overview information through `getMetadata()`.
- Supports URL and `Blob` inputs.
- Uses HTTP byte ranges for remote GeoTIFF access and can integrate with a shared `RangeRequestScheduler`.
- Returns native-projection raster values; reprojection is not performed in v1.
- Rejects viewport requests whose `viewport.crs` does not match the dataset CRS.

## API

### `getMetadata(): Promise<RasterSourceMetadata>`

Returns normalized metadata for the GeoTIFF dataset.

Notable fields include:

- `crs?: string`
- `boundingBox?: [[minX, minY], [maxX, maxY]]`
- `width`, `height`
- `bandCount`
- `dtype`
- `tileSize`
- `overviews`

### `getRaster(parameters: GetRasterParameters): Promise<RasterData>`

Loads raster samples for the requested viewport.

- `viewport` is required and must include either `bounds` or `getBounds()`.
- `bands?: number[]` selects one or more sample bands.
- `interleaved?: boolean` returns one interleaved typed array for multi-band reads.
- `resampleMethod?: 'nearest' | 'bilinear'` selects source-side resampling when supported.
- `signal?: AbortSignal` aborts the underlying request.

The returned `RasterData` contains:

- `data: TypedArray | TypedArray[]`
- `width`, `height`
- `bandCount`
- `dtype`
- `boundingBox`
- `crs`
- `noData`

## Notes

- GeoTIFF overview selection compares both source pixel resolutions with the requested region; `geotiff.js` decodes the selected image window.
- For remote COGs, `GeoTIFFSourceLoader` can share a `RangeRequestScheduler` with other sources to
  coalesce overlapping byte-range requests.

## Explicit numeric region reads

`GeoTIFFRasterSource.supportsRegion` is `true`. Use
`getRasterForRegion({bounds, crs, width, height, bands, signal})` when coverage is
already available independently of a viewport. Bounds are finite, ordered,
non-wrapped rectangles in canonical x/y order. CRS must explicitly match the
source. Missing georeferencing and unsupported conversion fail instead of assuming
geographic degrees. Each antimeridian split remains a separate payload.

Both region and viewport requests use the same window pipeline. Available
TIFF overview images are selected by requested resolution on both axes. Results
include the selected overview, effective resolution, per-band source indices,
owned arrays, and the window affine transform. A rotated window can cover more
than the requested rectangle; its affine, rather than its enclosing bbox, places
individual samples. TIFF decoder metadata remains separate from raw samples. Native point registration
is normalized to area registration in returned windows by shifting the affine origin
half a native pixel. Returned sample centers therefore retain their source coordinates.
Resized windows use shared validity-aware nearest/bilinear sampling; bilinear samples
with invalid contributing neighbors remain invalid. Continuous band values retain the
decoder's typed representation, while categorical bands use nearest sampling. This
sample-center normalization can change boundary samples compared with the earlier
GeoTIFF bbox resampling convention.

`maxPixels` (default 16,000,000) and `maxDecodedBytes` (default 256 MiB) may be set
per region or in `geotiff` source options. These bound returned samples and conservatively estimate native window and tile
allocations before decoding. Third-party decoder scratch allocations are not directly
observable. Range schedulers additionally
bound concurrency, queue size, and individual range sizes. Invalid output lengths
and decoded-byte overflow fail. A non-overlapping payload has an explicit invalid
mask, so valid zero is never confused with missing coverage.

Cancellation is passed to geotiff.js reads and range transport. An obsolete result
is discarded after decoding even when a decoder cannot be interrupted. Shared
initialization uses subscriber leases: one caller cannot cancel another caller's
metadata transport, and the last canceled subscriber aborts initialization. Failed
or canceled initialization may be retried. Source finalization cancels its own reads
without disposing an injected scheduler.

## Shared CPU identify

`@loaders.gl/loader-utils` exports `sampleRaster`, `rasterCoordinateToPixel`,
`isRasterSampleValid`, `computeRasterStatistics`, and `canReuseRasterCoverage`.
They perform no network calls and never mutate sample buffers. Coordinates passed
to the affine inverse must explicitly use the payload CRS. The affine maps grid
coordinates; area registration places centers at `(column + 0.5, row + 0.5)` and
point registration at `(column, row)`.

Sampling returns an explicit miss, values, per-band validity, original band indices,
overview and provenance. Nearest uses `floor(index + 0.5)`; bilinear requires all
neighbors with nonzero weight to be valid and uses nearest for categorical bands.
Masks cannot override raw nodata or non-finite invalidity. Float32 nodata compares
at representable Float32 precision. Physical mode applies `raw * scale + offset`
once after validity checks. Statistics take a mandatory sample budget and report
exact versus sampled scope; all-invalid ranges are absent and constants retain
equal extrema. Original declared statistics remain in format metadata.

Coverage reuse is opt-in through the existing RasterSet refetch policy. The helper
requires identical source, revision, opaque authorization context, interpretation,
service parameters and selected dimensions/bands. Both resolution axes must meet
`maximumStretch` (default one); rotated grids are conservatively rejected. Only the
accepted payload is retained by RasterSet; there is no additional raster cache.

The [independent example](https://github.com/visgl/loaders.gl/tree/master/examples/experimental/raster-regions)
uses an injected coverage provider and preserves split placement without deck.gl.

### Remaining source limitations

This implementation does not provide generic CRS conversion, mosaicking, terrain
meshing, globe camera coverage, or provider-configured TiTiler orchestration. Shared
numeric metadata fields are optional; GeoTIFF band names, units and scale/offset are read from GDAL metadata when present.
Mixed original dtypes produce the additive `RasterMixedData` variant (`dtype: 'mixed'`,
planar arrays and required per-band dtype). Interleaving is rejected for this variant.
The legacy viewport entry requires a common dtype; select one band or use regions for
mixed-type reads. `discoverGeoTIFF` detects explicitly
selected extensionless assets through an eight-byte range GET, independent of MIME
hints. Servers ignoring Range are rejected without buffering the whole response.
Callers must resolve STAC documents to assets before detection. TIFF magic does not
establish cloud optimization. Source initialization and range transport propagate cancellation; synchronous
decoders can only discard obsolete output at their next asynchronous boundary. Worker
cloneability of the plain metadata contract does not by itself establish every
source's worker lifecycle. The optional layer retains percentile stretch by default;
`colorizeRasterData(raster, {stretch: 'range'})` opts into bounded min/max stretch.

Internal TIFF mask IFDs are read on the selected native grid, retain zero-as-invalid
semantics, and participate in bilinear validity. Mask IFDs are never numeric
overviews. A masked source falls back to an overview with a matching mask grid;
ambiguous masks are rejected. GDAL per-band metadata, including declared statistics,
is preserved separately at `metadata.bandMetadata`. Finite, ordered extrema also appear in
`bands[index].declaredStatistics` with source scope and an explicit `unknown` domain;
missing valid counts are not inferred from rounded GDAL percentages. Computed statistics do not
replace these declarations or guess their value domain. Alpha interpretation and
external `.msk` files are not implemented by the numeric source.

Coverage reuse is opt-in through `canReuseRasterCoverage` and RasterSet's existing
`shouldRefetch` hook. Pass opaque revision, authorization, interpretation and service
identity tokens. No credential is exported in provenance. Recreate the source when
its revision or authorization changes: its bounded decoder cache belongs to that
source instance. Sharing a scheduler does not share initialization or decoded caches.

Encoded byte ranges use the existing loaders.gl `RangeRequestCache`, scoped to one
source with `geotiff.rangeCacheProps.maxEntries` (128 by default) and `maxBytes`
(8 MiB by default). Both must be nonnegative safe integers; zero disables settled
retention. Pending client requests, including shared cache subscribers, are limited
by `rangeSchedulerProps.maxQueueSize` (4096 by default). geotiff.js's internal block
cache is disabled because its interrupted-block retry can omit cancellation. The
loaders.gl cache coalesces exact reads and the scheduler coalesces adjacent ranges;
only the last subscriber aborts owned transport. Cached buffers are copied for readers.
Changing authorization or source revision requires a new source instance. Source
finalization clears its cache while preserving borrowed schedulers. Decoded tile
caching remains disabled; output buffers are owned by the consumer.

Declared HTTP object length, ETag and Last-Modified must stay consistent across
uncached reads. Contradictions invalidate this source and require recreation. These
revision hints remain private to transport identity. A cache hit does not poll the
server for changes. Responses with incorrect Content-Range placement, excessive
encoded bytes, or truncated data fail before publication. Encoded streams are read
only up to the requested range budget. Blob directory reads depend on geotiff.js's
cancellation support; obsolete results are discarded even when those reads cannot
be interrupted.

Native reads decode selected planar bands before packing a requested interleaved layout, preserving each selected representation instead of inheriting a wider unselected band type. Invalid raw values are preserved when only the layout changes. TIFF palette indices are categorical and use nearest sampling. Overviews with different band representations or registration are not selected.
