---
title: PMTilesWriter
description: Package existing vector or raster tiles into a PMTiles v3 archive.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="PMTiles module · writer API"
  title="PMTilesWriter"
  description="Package encoded MVT, MLT or image tiles into one range-readable PMTiles v3 file."
  tone="violet"
  meta={['From v5.0', 'PMTiles v3', 'Browser and Node.js']}
  links={[
    {label: 'PMTiles format', to: '/docs/modules/pmtiles/formats/pmtiles'},
    {label: 'PMTiles source', to: '/docs/modules/pmtiles/api-reference/pmtiles-source-loader'},
    {label: 'PMTiles module', to: '/docs/modules/pmtiles'}
  ]}
/>

`PMTilesWriter` packages already encoded tiles. It preserves payload bytes, sorts tile addresses
in Hilbert order and writes the header, root directory, optional leaf directories and JSON metadata.
It supports MVT, MLT, PNG, JPEG, WebP and AVIF, with one declared payload format and compression
for the entire archive.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {PMTilesWriter, encodePMTiles} from '@loaders.gl/pmtiles';

const tiles = [
  {z: 1, x: 0, y: 0, data: firstMvtBytes},
  {z: 1, x: 1, y: 0, data: secondMvtBytes}
];
const options = {
  tileType: 'mvt' as const,
  metadata: {
    vector_layers: [{id: 'roads', fields: {name: 'String', class: 'String'}}]
  }
};
const archive = await encode(tiles, PMTilesWriter, {pmtiles: options});

// Direct encoding uses the same implementation and options.
const otherArchive = await encodePMTiles(tiles, options);
const download = new Blob([archive], {type: 'application/vnd.pmtiles'});
```

For an existing raster pyramid, use `tileType: 'png'`, `'jpeg'`, `'webp'` or `'avif'` and supply its
encoded image bytes. For MLT use `tileType: 'mlt'`. Neither workflow decodes or re-encodes tiles.

## Input

Accepts a finite `Iterable<PMTilesTile>` or `AsyncIterable<PMTilesTile>`:

| Field | Type | Meaning |
| --- | --- | --- |
| `z` | `number` | Integer zoom, 0–26 |
| `x`, `y` | `number` | Integers from 0 through `2 ** z - 1`, using XYZ north-origin Y |
| `data` | `ArrayBuffer \| ArrayBufferView \| Blob` | Nonempty, already encoded tile payload |

Convert TMS south-origin Y to XYZ before packaging: `xyzY = 2 ** z - 1 - tmsY`.
Input order does not matter. Duplicate tile coordinates, invalid coordinates and empty payloads
fail. Omit missing tiles; an entirely empty archive is rejected. Views use their exact byte offset
and length, and each payload is copied before the next tile is requested.

The caller owns tile discovery and enumeration. A URL template alone does not specify a finite
export: select tile addresses or a bounded area and zoom range first.

## Options

These options are passed directly to `encodePMTiles`, or under `pmtiles` to `PMTilesWriter`.

| Option | Default | Meaning |
| --- | --- | --- |
| `tileType` | Required | `'mvt'`, `'mlt'`, `'png'`, `'jpeg'`, `'webp'` or `'avif'` |
| `tileCompression` | `'none'` | Declares existing compression: `'none'`, `'gzip'`, `'brotli'` or `'zstd'`. Does not compress payloads. |
| `internalCompression` | `'none'` | Encodes directories and metadata with `'none'` or `'gzip'`, using the shared compression module. |
| `metadata` | `{}` | JSON object. MVT requires nonempty `vector_layers` with unique layer IDs and `fields` mapping property names to `'String'`, `'Number'` or `'Boolean'`. |
| `bounds` | Selected tile footprints | `[west, south, east, north]` in longitude/latitude degrees. Supply dataset bounds for tighter coverage. Bounds must be ordered and cannot cross the antimeridian. |
| `center` | Bounds midpoint, minimum tile zoom | `[longitude, latitude, zoom]`. Zoom must lie within the selected tile zoom range. |
| `maxTiles` | `100000` | Maximum enumerated tiles |
| `maxOutputBytes` | `268435456` (256 MiB) | Maximum complete archive bytes, including internal sections |
| `maxMetadataBytes` | `1048576` (1 MiB) | Maximum uncompressed UTF-8 metadata bytes |
| `signal` | None | AbortSignal checked while consuming tiles and between encoding stages |

Header zoom limits come from the selected tiles. Metadata and format declarations are supplied by
the caller; packaging does not inspect payload schemas, infer layer names or validate image/vector
contents. Metadata should describe the selected export and agree with its header. Declare gzip only
when every supplied payload is already gzip encoded; mixed compressed/uncompressed input is invalid.

## Memory and cancellation

This first version buffers payload snapshots, directory entries and the complete output in memory.
Async input permits incremental acquisition, but does not provide streaming output or out-of-core
conversion. Output bytes are checked before copying payloads and before allocating the final archive;
`maxOutputBytes` is an archive-size limit, not a peak-heap guarantee. Directory and compression
workspaces consume additional memory. Keep exports bounded in both browsers and Node.js.

Cancellation closes the input iterator when the writer detects an abort. A producer blocked in its
own pending operation must also observe the signal; the writer cannot interrupt an arbitrary
iterator's pending `next()` call. No partial archive is returned on failure.

## Scope

This API packages existing tile payloads. [GeoArrow-to-MVT/MLT authoring](./geoarrow-pmtiles) composes the existing tiler with this writer. Raster reprojection,
resampling and overview generation, source adapters, CLI export, browser download UI, deduplication,
and streaming file sinks are separate follow-up work. The existing
[Arrow table tiler](/docs/modules/mvt/api-reference/arrow-table-tile-source-loader) can supply
Arrow tiles to a future encoding/export pipeline.
