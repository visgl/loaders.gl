# RADLoader and RADSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`RADLoader` parses Spark `.rad` metadata. `RADSourceLoader` creates a runtime
source for range-fetching Spark `.rad` headers, RADC chunks, and decoded chunk
tables.

| Property   | Value                                      |
| ---------- | ------------------------------------------ |
| File format | [RAD](/docs/modules/splats/formats/splats) |
| Extensions | `.rad`                                    |
| Worker     | No                                        |
| Input type | `ArrayBuffer`, URL, or `Blob`             |
| Output     | RAD metadata or `RADSource`               |

## Usage

Use `RADSourceLoader` when working with remote LoD assets:

```typescript
import {load} from '@loaders.gl/core';
import {RADSourceLoader} from '@loaders.gl/splats';

const source = await load(url, RADSourceLoader);
const metadata = await source.getMetadata();
const firstChunk = await source.getChunk(0);
const firstChunkTable = await source.getChunkTable(0);

for await (const chunkTable of source.getChunkTables({
  maxChunks: 8,
  pruneLoadedLoDParents: true
})) {
  // Append each decoded chunk table to a renderer-owned page cache.
}
```

For full buffers, `RADLoader` returns just the top-level metadata:

```typescript
import {parse} from '@loaders.gl/core';
import {RADLoader} from '@loaders.gl/splats';

const metadata = await parse(arrayBuffer, RADLoader);
```

## Format Support

`RADLoader` and `RADSourceLoader` support Spark RAD version 1 files with `type:
'gsplat'`. The source understands:

- top-level `RAD0` metadata headers
- inline RADC chunks stored after the RAD header
- sidecar chunk filenames relative to the RAD URL
- RADC chunk metadata headers
- chunk range fetching through HTTP `Range` requests
- RADC payload decoding for centers, alpha, RGB, scales, orientations, LoD child
  arrays, and optional spherical harmonics
- Mesh Arrow table construction for individual chunks

RAD is a paged LoD format, so exact Spark-style rendering still requires a
renderer to drive page selection, LoD tree traversal, and GPU residency. The
source exposes chunk decoding so renderers and examples can bridge RAD pages into
the standard loaders.gl Gaussian splat Arrow table shape, or pass the source to
`RADSplatLayer` from `@loaders.gl/deck-layers` for deck.gl/luma.gl rendering.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `rad.headers` | `object` | `undefined` | Request headers forwarded to RAD and RADC fetches. |
| `rad.withCredentials` | `boolean` | `false` | Includes credentials for remote RAD and RADC fetches. |
| `rad.headerByteLengths` | `number[]` | `[65536, 262144, 1048576]` | Header probe sizes used while range-fetching remote RAD metadata. |
| `pruneLoadedLoDParents` | `boolean` | `false` | When iterating chunk tables, removes parent LoD splats whose children are included in the loaded chunk range. |
| `radChunk.includeLoDTree` | `boolean` | `true` | Keeps decoded `child_count` and `child_start` arrays in chunk `loaderData`. |
| `radChunk.includeSphericalHarmonics` | `boolean` | `false` | Adds decoded SH rest coefficients to chunk Arrow tables. |
