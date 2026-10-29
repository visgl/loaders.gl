Cloud raster source

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF

# GeoTIFFSourceLoader

GeoTIFFSourceLoader discovers raster metadata, selects an overview and band set, and reads only the ranges needed for a viewport or bounded request.

[GeoTIFF format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFF module](https://loaders.gl/next/docs/modules/raster/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF[Try GeoTIFF](https://loaders.gl/next/examples/geospatial/geotiff)[Try OME-TIFF](https://loaders.gl/next/examples/bioimaging/ome-tiff)[Overview](https://loaders.gl/next/docs/modules/raster/geotiff.md)[Format](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[GeoTIFFLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-loader.md)[GeoTIFFRasterLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-raster-loader.md)[GeoTIFFSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)[OMETiffSourceLoader](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/ometiff-source-loader.md)

Windowed raster access

## Read the window that answers the question.

Raster sources use metadata before pixels: discover the layout, choose the useful window, and decode only the ranges or chunks that cover it.

01 · discover

### GeoTIFF / Cloud Optimized GeoTIFF

TIFF pages and tiles carry georeferencing, bands, and overview metadata.

boundsbandsoverviews

pla&#x6E;**→**

02 · select

### Select a raster window

Use the coordinate system and resolution that match the request.

bboxoverviewband

rea&#x64;**→**

[03 · application result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

### [Typed raster result](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[Pixels, dimensions, transform, and CRS stay available to the application.<!-- --> ↗](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

[pixelstransformCRS](https://loaders.gl/next/docs/modules/raster/geotiff/api-reference/geotiff-source-loader.md)

A local file may use direct offsets; a cloud source may use HTTP ranges or object-store chunks. The application-facing selection remains the same.

The raster request

## Metadata chooses the read. The viewport supplies the question.

The source uses dimensions, transforms, overviews, and bounds to turn a viewport or raster query into a small typed result.

01

Discover

Dimensions, bands, CRS, bounds, and overviews

02

Select

Window, resolution, and components

03

Read

Relevant TIFF or COG byte ranges

04

Return

Typed CPU-side raster payload

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`GeoTIFFSourceLoader` creates a viewport-driven raster source for GeoTIFF and Cloud Optimized GeoTIFF (COG) datasets.

It accepts 2D viewport requests, loads the nearest source data for that view, and returns typed CPU-side raster payloads that can be uploaded to textures or colorized client-side.

Detailed guide

## GeoTIFF source usage

The sections below cover source construction, metadata, viewport requests, raster selection, and cloud range-read behavior.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {GeoTIFFSourceLoader} from '@loaders.gl/raster/geotiff/geotiff-source-loader';



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

## Behavior[​](#behavior "Direct link to Behavior")

* Loads GeoTIFF metadata once and exposes source CRS, bounds, band count, dtype, tile size, and overview information through `getMetadata()`.
* Supports URL and `Blob` inputs.
* Uses HTTP byte ranges for remote GeoTIFF access and can integrate with a shared `RangeRequestScheduler`.
* Returns native-projection raster values; reprojection is not performed in v1.
* Rejects viewport requests whose `viewport.crs` does not match the dataset CRS.

## API[​](#api "Direct link to API")

### `getMetadata(): Promise<RasterSourceMetadata>`[​](#getmetadata-promiserastersourcemetadata "Direct link to getmetadata-promiserastersourcemetadata")

Returns normalized metadata for the GeoTIFF dataset.

Notable fields include:

* `crs?: string`
* `boundingBox?: [[minX, minY], [maxX, maxY]]`
* `width`, `height`
* `bandCount`
* `dtype`
* `tileSize`
* `overviews`

### `getRaster(parameters: GetRasterParameters): Promise<RasterData>`[​](#getrasterparameters-getrasterparameters-promiserasterdata "Direct link to getrasterparameters-getrasterparameters-promiserasterdata")

Loads raster samples for the requested viewport.

* `viewport` is required and must include either `bounds` or `getBounds()`.
* `bands?: number[]` selects one or more sample bands.
* `interleaved?: boolean` returns one interleaved typed array for multi-band reads.
* `resampleMethod?: 'nearest' | 'bilinear'` selects source-side resampling when supported.
* `signal?: AbortSignal` aborts the underlying request.

The returned `RasterData` contains:

* `data: TypedArray | TypedArray[]`
* `width`, `height`
* `bandCount`
* `dtype`
* `boundingBox`
* `crs`
* `noData`

## Notes[​](#notes "Direct link to Notes")

* GeoTIFF overview selection compares both source pixel resolutions with the requested region; `geotiff.js` decodes the selected image window.
* For remote COGs, `GeoTIFFSourceLoader` can share a `RangeRequestScheduler` with other sources to coalesce overlapping byte-range requests.

## Explicit numeric region reads[​](#explicit-numeric-region-reads "Direct link to Explicit numeric region reads")

`GeoTIFFRasterSource.supportsRegion` is `true`. Use `getRasterForRegion({bounds, crs, width, height, bands, signal})` when coverage is already available independently of a viewport. Bounds are finite, ordered, non-wrapped rectangles in canonical x/y order. CRS must explicitly match the source. Missing georeferencing and unsupported conversion fail instead of assuming geographic degrees. Each antimeridian split remains a separate payload.

Both region and viewport requests use the same window pipeline. Available TIFF overview images are selected by requested resolution on both axes. Results include the selected overview, effective resolution, per-band source indices, owned arrays, and the window affine transform. A rotated window can cover more than the requested rectangle; its affine, rather than its enclosing bbox, places individual samples. TIFF decoder metadata remains separate from raw samples. Native point registration is normalized to area registration in returned windows by shifting the affine origin half a native pixel. Returned sample centers therefore retain their source coordinates. Resized windows use shared validity-aware nearest/bilinear sampling; bilinear samples with invalid contributing neighbors remain invalid. Continuous band values retain the decoder's typed representation, while categorical bands use nearest sampling. This sample-center normalization can change boundary samples compared with the earlier GeoTIFF bbox resampling convention.

`maxPixels` (default 16,000,000) and `maxDecodedBytes` (default 256 MiB) may be set per region or in `geotiff` source options. These bound returned samples and conservatively estimate native window and tile allocations before decoding. Third-party decoder scratch allocations are not directly observable. Range schedulers additionally bound concurrency, queue size, and individual range sizes. Invalid output lengths and decoded-byte overflow fail. A non-overlapping payload has an explicit invalid mask, so valid zero is never confused with missing coverage.

Cancellation is passed to geotiff.js reads and range transport. An obsolete result is discarded after decoding even when a decoder cannot be interrupted. Shared initialization uses subscriber leases: one caller cannot cancel another caller's metadata transport, and the last canceled subscriber aborts initialization. Failed or canceled initialization may be retried. Source finalization cancels its own reads without disposing an injected scheduler.

## Shared CPU identify[​](#shared-cpu-identify "Direct link to Shared CPU identify")

`@loaders.gl/core/loader-utils` exports `sampleRaster`, `rasterCoordinateToPixel`, `isRasterSampleValid`, `computeRasterStatistics`, and `canReuseRasterCoverage`. They perform no network calls and never mutate sample buffers. Coordinates passed to the affine inverse must explicitly use the payload CRS. The affine maps grid coordinates; area registration places centers at `(column + 0.5, row + 0.5)` and point registration at `(column, row)`.

Sampling returns an explicit miss, values, per-band validity, original band indices, overview and provenance. Nearest uses `floor(index + 0.5)`; bilinear requires all neighbors with nonzero weight to be valid and uses nearest for categorical bands. Masks cannot override raw nodata or non-finite invalidity. Float32 nodata compares at representable Float32 precision. Physical mode applies `raw * scale + offset` once after validity checks. Statistics take a mandatory sample budget and report exact versus sampled scope; all-invalid ranges are absent and constants retain equal extrema. Original declared statistics remain in format metadata.

Coverage reuse is opt-in through the existing RasterSet refetch policy. The helper requires identical source, revision, opaque authorization context, interpretation, service parameters and selected dimensions/bands. Both resolution axes must meet `maximumStretch` (default one); rotated grids are conservatively rejected. Only the accepted payload is retained by RasterSet; there is no additional raster cache.

The [independent example](https://github.com/visgl/loaders.gl/tree/master/examples/experimental/raster-regions) uses an injected coverage provider and preserves split placement without deck.gl.

### Remaining source limitations[​](#remaining-source-limitations "Direct link to Remaining source limitations")

This implementation does not provide generic CRS conversion, mosaicking, terrain meshing, globe camera coverage, or provider-configured TiTiler orchestration. Shared numeric metadata fields are optional; GeoTIFF band names, units and scale/offset are read from GDAL metadata when present. Mixed original dtypes produce the additive `RasterMixedData` variant (`dtype: 'mixed'`, planar arrays and required per-band dtype). Interleaving is rejected for this variant. The legacy viewport entry requires a common dtype; select one band or use regions for mixed-type reads. `discoverGeoTIFF` detects explicitly selected extensionless assets through an eight-byte range GET, independent of MIME hints. Servers ignoring Range are rejected without buffering the whole response. Callers must resolve STAC documents to assets before detection. TIFF magic does not establish cloud optimization. Source initialization and range transport propagate cancellation; synchronous decoders can only discard obsolete output at their next asynchronous boundary. Worker cloneability of the plain metadata contract does not by itself establish every source's worker lifecycle. The optional layer retains percentile stretch by default; `colorizeRasterData(raster, {stretch: 'range'})` opts into bounded min/max stretch.

Internal TIFF mask IFDs are read on the selected native grid, retain zero-as-invalid semantics, and participate in bilinear validity. Mask IFDs are never numeric overviews. A masked source falls back to an overview with a matching mask grid; ambiguous masks are rejected. GDAL per-band metadata, including declared statistics, is preserved separately at `metadata.bandMetadata`. Finite, ordered extrema also appear in `bands[index].declaredStatistics` with source scope and an explicit `unknown` domain; missing valid counts are not inferred from rounded GDAL percentages. Computed statistics do not replace these declarations or guess their value domain. Alpha interpretation and external `.msk` files are not implemented by the numeric source.

Coverage reuse is opt-in through `canReuseRasterCoverage` and RasterSet's existing `shouldRefetch` hook. Pass opaque revision, authorization, interpretation and service identity tokens. No credential is exported in provenance. Recreate the source when its revision or authorization changes: its bounded decoder cache belongs to that source instance. Sharing a scheduler does not share initialization or decoded caches.

Encoded byte ranges use the existing loaders.gl `RangeRequestCache`, scoped to one source with `geotiff.rangeCacheProps.maxEntries` (128 by default) and `maxBytes` (8 MiB by default). Both must be nonnegative safe integers; zero disables settled retention. Pending client requests, including shared cache subscribers, are limited by `rangeSchedulerProps.maxQueueSize` (4096 by default). geotiff.js's internal block cache is disabled because its interrupted-block retry can omit cancellation. The loaders.gl cache coalesces exact reads and the scheduler coalesces adjacent ranges; only the last subscriber aborts owned transport. Cached buffers are copied for readers. Changing authorization or source revision requires a new source instance. Source finalization clears its cache while preserving borrowed schedulers. Decoded tile caching remains disabled; output buffers are owned by the consumer.

Declared HTTP object length, ETag and Last-Modified must stay consistent across uncached reads. Contradictions invalidate this source and require recreation. These revision hints remain private to transport identity. A cache hit does not poll the server for changes. Responses with incorrect Content-Range placement, excessive encoded bytes, or truncated data fail before publication. Encoded streams are read only up to the requested range budget. Blob directory reads depend on geotiff.js's cancellation support; obsolete results are discarded even when those reads cannot be interrupted.

Native reads decode selected planar bands before packing a requested interleaved layout, preserving each selected representation instead of inheriting a wider unselected band type. Invalid raw values are preserved when only the layout changes. TIFF palette indices are categorical and use nearest sampling. Overviews with different band representations or registration are not selected.

### Strict browser range headers[​](#strict-browser-range-headers "Direct link to Strict browser range headers")

Set `geotiff.requireContentRange: true` to reject HTTP 206 responses without a readable `Content-Range` header before consuming their bodies. Cross-origin servers must include `Access-Control-Expose-Headers: Content-Range`. This qualifies EOF-clamped ranges using authoritative offsets and file length, including TIFFs smaller than the initial metadata read. The PMTiles browser converter enables this option. The default remains `false`; full-length responses without exposed headers retain their existing behavior, while EOF-shortened responses still require authoritative file length.

## Native TileMatrix geometry[​](#native-tilematrix-geometry "Direct link to Native TileMatrix geometry")

`getMetadata().tileGrid` describes physical storage tiles for eligible GeoTIFF/COG image hierarchies. It is built from metadata without decoding samples. Matrix IDs are original image (IFD) indices, matching `overviews[].index`; mask images and independent document pages are excluded without renumbering subsequent images. Secondary levels must carry a reduced-image flag (`NewSubfileType` bit 0 or legacy `SubfileType: 2`), matching raster overview selection. Overview order follows the file rather than assuming power-of-two zoom levels.

Each level retains its own tile dimensions, independent horizontal and vertical pixel resolutions, and origin. Overviews without their own transform inherit the reference transform scaled independently by their actual pixel dimensions. Point-registered sample centers are shifted by half a pixel to obtain tile corners. South-up images use a bottom-left origin.

Matrix dimensions round up image dimensions to complete storage tiles. Consequently edge tiles can extend past the raster's valid footprint: clip tile pixels using `overviews[].width/height`. `boundingBox` retains the existing source bounds convention; point-registered tile corners include the half-pixel adjustment described above. Grid dimensions describe geometry and do not declare data availability.

The optional grid is omitted if any participating reference/overview image uses strips, rotation, shear, reversed columns, invalid geometry, or an explicitly unknown or conflicting CRS, or if the reference CRS is unknown. Only absent overview CRS metadata may inherit the reference CRS. Existing affine metadata and raster reads remain available for these datasets. This does not add a tile-payload endpoint, reprojection, or a Web Mercator pyramid; use the existing window/region raster APIs to read samples.
