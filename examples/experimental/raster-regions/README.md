<!-- SPDX-License-Identifier: MIT -->
<!-- SPDX-FileCopyrightText: Copyright (c) vis.gl contributors -->

# Independent raster regions

`index.ts` exports `createRegionExample(source, coverageProvider)` and imports no
renderer. Supply a `GeoTIFFRasterSource` and an injected coverage provider. The
provider owns camera coverage, antimeridian splitting, projection-domain clipping,
and CRS conversion. The source rejects conversions it cannot perform.

For a geographic source, coverage from 170° to -170° is two requests:

```ts
const coverageProvider = () => [
  {bounds: [[170, -10], [180, 10]], crs: 'EPSG:4326', width: 128, height: 256},
  {bounds: [[-180, -10], [-170, 10]], crs: 'EPSG:4326', width: 128, height: 256}
];
const example = createRegionExample(source, coverageProvider);
example.update();
// On camera or projection changes, update the provider and call update again.
// Obsolete work is canceled; only the newest request can become accepted.
```

Each payload keeps its own affine transform and placement. A failed split fails the
combined request. `example.counters` counts started, accepted and canceled composite
requests; transport byte/range counts are available from the GeoTIFF range scheduler.
These counters have different scopes and should be inspected together.

Identify the renderer-selected payload using `example.identify(payload, coordinate,
coordinateReferenceSystem, 'physical')`, or use `'raw'`. Physical mode evaluates raw-domain nodata first, then
applies band scale and offset. Transform the renderer's picked world coordinate
into the payload CRS first; the explicit coordinate CRS argument must match the payload. Float single/multiband buffers use the same helper.
A Mercator coverage provider must clip latitude to its supported domain before
transforming; geographic poles cannot be represented in Mercator.

The optional `RasterSourceLayer` consumes the same sampling and validity utilities.
Its existing flat-map viewport path remains available. Curved globe meshes and
camera coverage are supplied by the renderer; this example does not claim globe
rendering parity.

After building the repository, use Node 22+ to run the standalone executable with a caller-selected
range-supported asset:

```sh
node --experimental-strip-types examples/experimental/raster-regions/run.ts <TIFF-URL>
```

The executable disables settled byte-cache retention and waits for a region transfer
to start before superseding it. It issues two rapid updates, prints request/transport counters and raw/physical
identify results, then disposes the resources it owns. No public endpoint is hard-coded.
