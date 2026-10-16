---
title: Raster to PMTiles
description: Export selected regions from a numeric raster source as PNG tiles in PMTiles v3.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="PMTiles module · authoring API"
  title="Raster to PNG to PMTiles"
  description="Reuse an existing raster region source to export selected image tiles in a downloadable archive."
  tone="violet"
  badges={[<span key="version" className="badge badge--info">From v5.0</span>]}
  links={[
    {label: 'GeoTIFF source', to: '/docs/modules/geotiff/api-reference/geotiff-source-loader'},
    {label: 'PMTiles writer', to: '/docs/modules/pmtiles/api-reference/pmtiles-writer'},
    {label: 'Vector authoring', to: '/docs/modules/pmtiles/api-reference/geoarrow-pmtiles'}
  ]}
/>

`encodeRasterPMTiles` accepts an existing numeric region source and a finite selection of canonical
XYZ tile addresses. It requests one region at a time, samples it through the shared raster sampler,
encodes PNG through `ImageWriter`, and packages a PMTiles v3 archive. It retains the caller's source;
the caller remains responsible for source disposal. This lightweight region contract reuses the
same source planning as the [common scan architecture](/docs/developer-guide/common-scan-architecture):
bounds, bands, native overviews, decoded-output limits and cancellation are handled by the source.
Tile addressing, rendering and archive encoding remain conversion responsibilities.

Try the [browser PMTiles export example](/examples/tiles/pmtiles-authoring) with a local file or dataset URL.

## Usage

```typescript
import {GeoTIFFRasterSource} from '@loaders.gl/raster/geotiff/index';
import {encodeRasterPMTiles} from '@loaders.gl/pmtiles/raster';

// A byte-valued grayscale, RGB or RGBA GeoTIFF/COG in a supported source CRS.
const source = new GeoTIFFRasterSource('https://example.com/imagery.tif', {});
try {
  const archive = await encodeRasterPMTiles(source, {
    tiles: [{z: 2, x: 1, y: 1}, {z: 2, x: 2, y: 1}],
    bands: [0, 1, 2],
    tileSize: 256,
    pmtiles: {maxTiles: 100, maxOutputBytes: 16 * 1024 * 1024, metadata: {name: 'Imagery'}}
  });
  const url = URL.createObjectURL(new Blob([archive], {type: 'application/vnd.pmtiles'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'imagery.pmtiles';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
} finally {
  source.finalize();
}
```

The implementation subpath keeps raster export orchestration outside packaging-only root imports.
Browser encoding requires canvas APIs. Node applications must install `@loaders.gl/polyfills` and its
optional image encoder dependencies (`save-pixels` and `ndarray`), and import the polyfills **before**
importing the authoring API. No Node APIs or new codec dependencies are introduced by this helper.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `tiles` | Required | Finite iterable or async iterable of canonical `{z, x, y}`, zoom 0–26 |
| `tileSize` | `256` | Square PNG dimensions, integer 1–1024 |
| `bands` | All source bands | One through four distinct source indices, interpreted as gray, gray/alpha, RGB or RGBA |
| `selection` | None | Named nonspatial source dimension indices, forwarded to region requests |
| `maxSourcePixels` | `1048576` | Maximum returned region pixels; also forwarded as source `maxPixels` |
| `maxDecodedBytes` | 32 MiB | Returned sample/mask buffers plus RGBA output; also forwarded to the source |
| `pmtiles` | Writer defaults | Archive limits, cancellation, auxiliary JSON metadata, bounds, center and internal compression |

See [archive options](/docs/modules/pmtiles/api-reference/pmtiles-writer#options).
PNG payloads are uncompressed at the PMTiles container level; directory/metadata compression may be
none or gzip. Archive bounds and zooms are derived from nonempty selected tile footprints unless
explicit bounds/center are supplied. Stale vector and source-summary metadata is removed.

## Source and rendering contract

Sources provide `getMetadata` and `getRasterForRegion` from the shared raster region contract.
Source CRS must be the string `EPSG:3857`, `EPSG:4326` or `OGC:CRS84`. Returned regions must include
the same CRS and a finite nonsingular affine transform, with area or point registration. The exporter
uses this affine even when the returned region is clipped, rotated, or has different dimensions.
Longitude/latitude regions are sampled at Web Mercator pixel-center latitudes; they are not simply
stretched into a Mercator tile. Other CRSs require prior reprojection.

This first profile uses nearest sampling and raw `uint8` imagery, including planar or interleaved
`Uint8Array` or `Uint8ClampedArray` buffers. It preserves nodata and per-band/common validity masks. A pixel is transparent if any
selected channel is invalid; valid alpha is retained, and RGB/gray defaults to opaque. Fully
transparent tiles are omitted. Nonidentity band scale/offset and wider/scientific sample types fail
explicitly: convert or style them into display-ready bytes first. Color palettes, color management,
scientific range mapping and terrain encodings are separate work.

## Budgets and cancellation

The archive and encoded tile snapshots coexist in memory. `maxTiles` counts **requested** addresses,
including empty tiles. Duplicate/invalid addresses fail; an empty final archive fails. Output budgets
are enforced by the packaging writer. Sources receive the region budgets and signal, but their
native decode allocations remain source-specific; these limits are not a peak-heap guarantee.

Pass `pmtiles.signal` to cancel metadata discovery, region acquisition, rendering or packaging.
Rendering yields between row groups. Detected failure/abort closes the selection iterator; pending
async address producers must observe the signal themselves. Image encoding already in progress may
finish internally after cancellation, but no partial archive is returned. The exporter never
finalizes the source, so cancellation does not end other callers' use of that source.
