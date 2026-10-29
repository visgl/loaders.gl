RAD source

# Page large splat datasets instead of loading them all.

`RADLoader` reads local RAD metadata while `RADSourceLoader` discovers and range-fetches Spark RAD chunks. The source exposes decoded chunk tables so a renderer can own level-of-detail selection and GPU residency.

[Splats module](https://loaders.gl/next/docs/modules/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats.md)[Splat formats](https://loaders.gl/next/docs/modules/splats/formats/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats/formats/splats.md)[Source architecture](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The RAD source path

## Read metadata first. Fetch only the chunks a view needs.

RAD separates dataset metadata from chunk payloads. The source keeps that boundary explicit while returning each decoded page in the standard table shape.

01

Discover

RAD metadata, hierarchy, and chunk locations

02

Fetch

Range requests for RAD and RADC payloads

03

Decode

Chunk attributes into Mesh Arrow tables

04

Control

Renderer-owned LoD traversal and cache policy

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`RADLoader` parses Spark `.rad` metadata. `RADSourceLoader` creates a runtime source for range-fetching Spark `.rad` headers, RADC chunks, and decoded chunk tables.

Detailed guide

## RAD source and chunk details

The reference below covers local parsing, remote range fetching, chunk iteration, decoded attributes, options, and the renderer boundary.

| Property    | Value                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| File format | [RAD](https://loaders.gl/next/docs/modules/splats/formats/splats.md) |
| Extensions  | `.rad`                                                                    |
| Worker      | ❌ No                                                                     |
| Input type  | `ArrayBuffer`, URL, or `Blob`                                             |
| Output      | RAD metadata or `RADSource`                                               |

## Usage[​](#usage "Direct link to Usage")

Use `RADSourceLoader` when working with remote LoD assets:

```
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

```
import {parse} from '@loaders.gl/core';

import {RADLoader} from '@loaders.gl/splats';



const metadata = await parse(arrayBuffer, RADLoader);
```

## Format Support[​](#format-support "Direct link to Format Support")

`RADLoader` and `RADSourceLoader` support Spark RAD version 1 files with `type: 'gsplat'`. The source understands:

* top-level `RAD0` metadata headers
* inline RADC chunks stored after the RAD header
* sidecar chunk filenames relative to the RAD URL
* RADC chunk metadata headers
* chunk range fetching through HTTP `Range` requests
* RADC payload decoding for centers, alpha, RGB, scales, orientations, LoD child arrays, and optional spherical harmonics
* Mesh Arrow table construction for individual chunks

RAD is a paged LoD format, so exact Spark-style rendering still requires a renderer to drive page selection, LoD tree traversal, and GPU residency. The source exposes chunk decoding so renderers and examples can bridge RAD pages into the standard loaders.gl Gaussian splat Arrow table shape.

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

| Option                               | Type       | Default                    | Description                                                                                                   |
| ------------------------------------ | ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `rad.headers`                        | `object`   | `undefined`                | Request headers forwarded to RAD and RADC fetches.                                                            |
| `rad.withCredentials`                | `boolean`  | `false`                    | Includes credentials for remote RAD and RADC fetches.                                                         |
| `rad.headerByteLengths`              | `number[]` | `[65536, 262144, 1048576]` | Header probe sizes used while range-fetching remote RAD metadata.                                             |
| `pruneLoadedLoDParents`              | `boolean`  | `false`                    | When iterating chunk tables, removes parent LoD splats whose children are included in the loaded chunk range. |
| `radChunk.includeLoDTree`            | `boolean`  | `true`                     | Keeps decoded `child_count` and `child_start` arrays in chunk `loaderData`.                                   |
| `radChunk.includeSphericalHarmonics` | `boolean`  | `false`                    | Adds decoded SH rest coefficients to chunk Arrow tables.                                                      |
