---
title: PLYLoader
description: Parse Polygon File Format meshes into Mesh Arrow tables or legacy Mesh objects.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

<DocPageHeader
  format="ply"
  eyebrow="PLY loader"
  title="Read a classic mesh file into the shape your renderer needs."
  description="`PLYLoader` parses Polygon File Format files and can return either the legacy Mesh object or a Mesh Arrow table. Choose the output shape at the boundary so downstream geometry code can stay consistent."
  tone="violet"
  meta={['PLY', 'Mesh and Arrow table', 'Batched parsing']}
  links={[
    {label: 'PLY module', to: '/docs/modules/pointclouds/ply'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'},
    {label: 'PLYWriter', to: '/docs/modules/pointclouds/ply/api-reference/ply-writer'}
  ]}
/>

<DocOrientation
  eyebrow="The PLY path"
  title="Parse vertices and faces. Select a legacy or columnar result."
  description="PLY is a flexible mesh container. loaders.gl keeps the parser focused on its records while letting applications choose the representation that best fits existing rendering or columnar pipelines."
  tone="violet"
  items={[
    {label: 'Input', value: 'ASCII or binary PLY mesh data'},
    {label: 'Records', value: 'Vertices, faces, normals, colors, and UVs'},
    {label: 'Output', value: 'Mesh object or Mesh Arrow table'},
    {label: 'Streaming', value: 'Batched parsing for Arrow table output'}
  ]}
/>

<PlyDocsTabs active="plyloader" />

<ReferenceBoundary
  title="PLY parsing and output details"
  description="The reference below covers output shapes, attributes, batched parsing, and loader options."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

`PLYLoader` parses simple meshes in the Polygon File Format or the Stanford Triangle Format and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) by default.

Set `ply.shape: 'mesh'` to return the legacy [Mesh](/docs/specifications/category-mesh) object.

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

## Usage

```typescript
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PLYLoader, options);
const table = await load(url, PLYLoader, {ply: {shape: 'arrow-table'}});
```

## Batched Parsing

`PLYLoader` supports `loadInBatches` and `parseInBatches`. When `ply.shape: 'arrow-table'` is set, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';

const batches = await loadInBatches(url, PLYLoader, {
  ply: {shape: 'arrow-table'}
});

for await (const batch of batches) {
  console.log(batch.length, batch.data);
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `ply.shape` | `'mesh' \| 'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table or legacy Mesh output. |


## Worker batches

`PLYLoader` supports `parseInBatches()` on its built-in browser worker. The worker stays
leased for the input iterator and transfers owned Arrow column buffers. The caller
hydrates Mesh Arrow tables and performs any requested legacy `shape: 'mesh'` conversion.
`loaderData` on Arrow batches retains the parsed source header, including comments and elements.
Its element counts describe the source; use `batch.length` for the current batch row count.
Schemas and small loader/batch descriptors accompany the binary buffers; decoded row objects
are not sent from the worker. JSON conversion, if needed by an application, happens on the caller.

```typescript
const batches = await parseInBatches(input, PLYLoader, {
  core: {worker: true, batchSize: 1000},
  ply: {shape: 'arrow-table', pointCloud: true}
});
for await (const batch of batches) {
  consume(batch.data);
}
```

Use `ply.pointCloud: true` for incremental vertex batches in ASCII and binary PLY. General meshes may require the remaining elements before they can be returned.

Cancellation uses the shared `signal` option. Aborting or ending iteration releases the worker;
transferred input buffers remain detached. Self-hosted workers must implement the batch protocol
and opt in with `core.workerInBatches: true`. Custom workers must use the current Arrow column wire format. This module ships a browser worker; Node workers require a compatible Node artifact.
The parser-bearing loader is available from `@loaders.gl/pointclouds/ply/ply-loader`.
