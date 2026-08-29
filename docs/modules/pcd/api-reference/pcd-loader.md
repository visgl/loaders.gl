---
title: PCDLoader
description: Decode Point Cloud Data into point-cloud or Mesh Arrow tables.
hide_title: true
page_style: designed
---

import {PcdDocsTabs} from '@site/src/components/docs/pcd-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="PCD module · loader API"
  title="PCDLoader"
  description="Decode ASCII, binary, and compressed Point Cloud Data into a point-cloud object or a Mesh Arrow table with named attributes."
  tone="violet"
  meta={['From v1.0', 'ASCII and binary', 'Point cloud / Arrow']}
  links={[
    {label: 'PCD format', to: '/docs/modules/pcd/formats/pcd'},
    {label: 'PCDWriter', to: '/docs/modules/pcd/api-reference/pcd-writer'},
    {label: 'PCD module', to: '/docs/modules/pcd'}
  ]}
/>

<PcdDocsTabs active="pcdloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Keep point positions and named attributes together."
  description="PCDLoader reads the schema in the PCD header, then decodes the point records into the representation that best fits the next stage of the pipeline."
  tone="violet"
  items={[
    {label: 'Input', value: 'ASCII, binary, or compressed PCD'},
    {label: 'Default', value: 'Legacy PointCloud mesh object'},
    {label: 'Arrow', value: 'Mesh Arrow table with columns'},
    {label: 'Streaming', value: 'Batches for ASCII and uncompressed binary'}
  ]}
/>

<ReferenceBoundary
  title="PCDLoader reference"
  description="The sections below document format metadata, usage, batch parsing, output shapes, and options."
  tone="violet"
/>

`PCDLoader` parses point cloud data in the Point Cloud Data (PCD) format and returns a legacy [PointCloud](/docs/specifications/category-mesh) object by default.

Set `pcd.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Shape         | Output             | Use when                                  |
| ------------- | ------------------ | ----------------------------------------- |
| `mesh`        | `PointCloud`       | You want the legacy point cloud object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar point cloud attributes. |

Note: Currently supports `ascii`, `binary` and compressed binary files.

## Usage

```typescript
import {PCDLoader} from '@loaders.gl/pcd';
import {load} from '@loaders.gl/core';

const data = await load(url, PCDLoader, options);
const table = await load(url, PCDLoader, {pcd: {shape: 'arrow-table'}});
```

## Batched Parsing

`PCDLoader` supports `loadInBatches` and `parseInBatches` for ASCII and uncompressed binary PCD data. When `pcd.shape: 'arrow-table'` is set, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table. Compressed binary PCD files fall back to a single parsed batch.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';

const batches = await loadInBatches(url, PCDLoader, {
  batchSize: 100_000,
  pcd: {shape: 'arrow-table'}
});

for await (const batch of batches) {
  console.log(batch.length, batch.data);
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `pcd.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects PointCloud or Mesh Arrow table output. |
