---
title: RADLoader and RADSourceLoader
description: Read Spark RAD metadata and range-fetch Gaussian splat chunks as typed tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="RAD source"
  title="Page large splat datasets instead of loading them all."
  description="`RADLoader` reads local RAD metadata while `RADSourceLoader` discovers and range-fetches Spark RAD chunks. The source exposes decoded chunk tables so a renderer can own level-of-detail selection and GPU residency."
  tone="violet"
  meta={['Spark RAD', 'Range requests', 'Level of detail']}
  links={[
    {label: 'Splats module', to: '/docs/modules/splats'},
    {label: 'Splat formats', to: '/docs/modules/splats/formats/splats'},
    {label: 'Source architecture', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The RAD source path"
  title="Read metadata first. Fetch only the chunks a view needs."
  description="RAD separates dataset metadata from chunk payloads. The source keeps that boundary explicit while returning each decoded page in the standard table shape."
  tone="violet"
  items={[
    {label: 'Discover', value: 'RAD metadata, hierarchy, and chunk locations'},
    {label: 'Fetch', value: 'Range requests for RAD and RADC payloads'},
    {label: 'Decode', value: 'Chunk attributes into Mesh Arrow tables'},
    {label: 'Control', value: 'Renderer-owned LoD traversal and cache policy'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`RADLoader` parses Spark `.rad` metadata. `RADSourceLoader` creates a runtime
source for range-fetching Spark `.rad` headers, RADC chunks, and decoded chunk
tables.

<ReferenceBoundary
  title="RAD source and chunk details"
  description="The reference below covers local parsing, remote range fetching, chunk iteration, decoded attributes, options, and the renderer boundary."
  tone="violet"
/>

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
the standard loaders.gl Gaussian splat Arrow table shape.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `rad.headers` | `object` | `undefined` | Request headers forwarded to RAD and RADC fetches. |
| `rad.withCredentials` | `boolean` | `false` | Includes credentials for remote RAD and RADC fetches. |
| `rad.headerByteLengths` | `number[]` | `[65536, 262144, 1048576]` | Header probe sizes used while range-fetching remote RAD metadata. |
| `pruneLoadedLoDParents` | `boolean` | `false` | When iterating chunk tables, removes parent LoD splats whose children are included in the loaded chunk range. |
| `radChunk.includeLoDTree` | `boolean` | `true` | Keeps decoded `child_count` and `child_start` arrays in chunk `loaderData`. |
| `radChunk.includeSphericalHarmonics` | `boolean` | `false` | Adds decoded SH rest coefficients to chunk Arrow tables. |
