---
title: PLYLoader
description: Parse Polygon File Format meshes into legacy Mesh objects or Mesh Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

<DocPageHeader
  eyebrow="PLY loader"
  title="Read a classic mesh file into the shape your renderer needs."
  description="`PLYLoader` parses Polygon File Format files and can return either the legacy Mesh object or a Mesh Arrow table. Choose the output shape at the boundary so downstream geometry code can stay consistent."
  tone="violet"
  meta={['PLY', 'Mesh and Arrow table', 'Batched parsing']}
  links={[
    {label: 'PLY module', to: '/docs/modules/ply'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'},
    {label: 'PLYWriter', to: '/docs/modules/ply/api-reference/ply-writer'}
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

`PLYLoader` parses simple meshes in the Polygon File Format or the Stanford Triangle Format and returns a legacy [Mesh](/docs/specifications/category-mesh) object by default.

Set `ply.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

## Usage

```typescript
import {PLYLoader} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PLYLoader, options);
const table = await load(url, PLYLoader, {ply: {shape: 'arrow-table'}});
```

## Batched Parsing

`PLYLoader` supports `loadInBatches` and `parseInBatches`. When `ply.shape: 'arrow-table'` is set, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

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
| `ply.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects Mesh or Mesh Arrow table output. |
