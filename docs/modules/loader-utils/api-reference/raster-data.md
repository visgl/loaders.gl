{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Numeric raster data and CPU sampling

`RasterData` retains its existing common dtype and planar/interleaved layouts.
Optional `bands` describe original source indices, dtype, name, units, raw nodata,
scale, offset and categorical values. `RasterMixedData` adds a distinct `dtype:
'mixed'` planar variant with required per-band types; `NumericRasterData` accepts
both. Mixed bands are never silently widened or interleaved.

`transform` stores `[columnScale, rowShear, originX, columnShear, rowScale, originY]`.
It maps raster grid coordinates into the explicitly declared source CRS. Area sample
centers are `(column + 0.5, row + 0.5)`; point centers are `(column, row)`. Missing
CRS/transform remain unavailable. For legacy payloads without registration, the
helper uses area registration; sources should declare registration explicitly. A bbox alone cannot reconstruct a
rotated grid. `rasterCoordinateToPixel(raster, coordinate, crs)` inverts this affine,
returns fractional sample indices, and rejects missing, singular or mismatched
georeferencing. Applications supply any CRS conversion.

```ts
import {rasterCoordinateToPixel, sampleRaster, computeRasterStatistics} from '@loaders.gl/loader-utils';

const pixel = rasterCoordinateToPixel(raster, coordinate, raster.crs);
const raw = sampleRaster(raster, pixel, {bands: [0], method: 'nearest'});
const physical = sampleRaster(raster, pixel, {bands: [0], domain: 'physical'});
const statistics = computeRasterStatistics(raster, 4096, 'raw');
```

Sampling is synchronous and does not modify or fetch buffers. It returns `miss`,
values, per-band validity, original indices, overview and provenance. Invalid values
are undefined. Nearest rounds with `floor(index + 0.5)`. Bilinear requires every
nonzero-weight neighbor to be valid; categorical bands use nearest. Samples never
blend across separately placed payloads.

A validity mask declares width, height, optional payload band, offset, pixel stride
and row stride (defaults: offset zero, stride one, row stride width). Zero is invalid.
Every applicable mask must be nonzero. Raw nodata and non-finite samples remain
invalid even when masks are valid. Float32 nodata is rounded to representable
precision. Physical values apply scale and offset once after raw validity checks.

Statistics report payload scope, band, raw/physical domain, valid count and exact or
sampled method. The budget is per band. Sampled counts/ranges describe inspected
samples, not full-data extrema. All-invalid bands omit min/max; constants retain
equal extrema. Keep format-declared statistics separate because their scope or
value domain may differ.

`ownership` describes owned, borrowed or transferred arrays. Structured clone and
buffer transfer retain metadata and typed layouts; transferring detaches the sending
buffer. Callers must retain ownership until all sampling and rendering complete.

`validateRasterRegion` checks finite, ordered non-wrapped bounds, positive integer
dimensions and estimated decoded-memory budgets. GeoTIFF and WMS use this shared
validation. `canReuseRasterCoverage` is an opt-in RasterSet refetch policy helper:
source, revision, opaque authorization/interpretation/service identities and band/
dimension selections must match. Coverage must contain the candidate and satisfy
both resolution axes at the configured maximum stretch. Rotated grids are rejected.

Source declarations use `RasterDeclaredBandStatistics` under each band’s `declaredStatistics`, separately from computed payload statistics. The method is `declared`, the scope is `source` or `overview`, and the domain may be `unknown`. An unavailable valid count is omitted. Consumers must not use an unknown-domain declaration as a raw or physical display range.
