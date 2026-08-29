---
title: OBJLoader
description: Parse Wavefront OBJ and MTL geometry into Mesh objects or Mesh Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

<DocPageHeader
  eyebrow="OBJ loader"
  title="Bring Wavefront geometry into a shared mesh pipeline."
  description="`OBJLoader` parses the classic OBJ/MTL text format and can return a legacy Mesh object or Mesh Arrow table. For large vertex-only files, it also exposes a batched point-cloud path."
  tone="violet"
  meta={['OBJ and MTL', 'Mesh and Arrow table', 'Point-cloud batches']}
  links={[
    {label: 'OBJ module', to: '/docs/modules/obj'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'},
    {label: 'OBJWriter', to: '/docs/modules/obj/api-reference/obj-writer'}
  ]}
/>

<DocOrientation
  eyebrow="The OBJ path"
  title="Read text geometry. Preserve the representation you need."
  description="OBJ is human-readable and widely supported, but its records are not columnar. The loader resolves faces, materials, and attributes before exposing a renderer-friendly or Arrow-backed result."
  tone="violet"
  items={[
    {label: 'Input', value: 'OBJ geometry with optional MTL materials'},
    {label: 'Records', value: 'Vertices, normals, UVs, colors, and faces'},
    {label: 'Output', value: 'Mesh object or Mesh Arrow table'},
    {label: 'Streaming', value: 'Batched vertex parsing for point clouds'}
  ]}
/>

<ObjDocsTabs active="objloader" />

<ReferenceBoundary
  title="OBJ parsing and output details"
  description="The reference below covers output shapes, material and geometry records, batched parsing, and loader options."
  tone="violet"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

`OBJLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format and returns a legacy [Mesh](/docs/specifications/category-mesh) object by default.

Set `obj.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

## Usage

```typescript
import {OBJLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const data = await load(url, OBJLoader, options);
const table = await load(url, OBJLoader, {obj: {shape: 'arrow-table'}});
```

## Batched Parsing

`OBJLoader` supports `loadInBatches` and `parseInBatches` for vertex-only OBJ point clouds. By default, the loader scans the OBJ text before batching; if `f` face records or `l` line records are present, it falls back to atomic parsing and yields one batch.

Set `obj.pointCloud: true` when the input is known to be a point cloud and should stream `v` vertex records without waiting for a whole-file geometry scan. With `obj.shape: 'arrow-table'`, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const batches = await loadInBatches(url, OBJLoader, {
  batchSize: 100_000,
  obj: {shape: 'arrow-table', pointCloud: true}
});

for await (const batch of batches) {
  console.log(batch.length, batch.data);
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `obj.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects Mesh or Mesh Arrow table output. |
| `obj.pointCloud` | `boolean` | `false` | Streams OBJ `v` records as point-cloud batches. Use only for known point-cloud OBJ inputs. |

Remarks:

- vertex colors are parsed as a `COLOR_0` attribute when red, green and blue values are included after x y and z (this precludes specifying w). The color values range from 0 to 1.

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.
