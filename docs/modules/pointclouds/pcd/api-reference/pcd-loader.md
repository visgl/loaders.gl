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
  format="pcd"
  eyebrow="PCD module · loader API"
  title="PCDLoader"
  description="Decode ASCII, binary, and compressed Point Cloud Data into a point-cloud object or a Mesh Arrow table with named attributes."
  tone="violet"
  meta={['From v1.0', 'ASCII and binary', 'Point cloud / Arrow']}
  links={[
    {label: 'PCD format', to: '/docs/modules/pointclouds/pcd/formats/pcd'},
    {label: 'PCDWriter', to: '/docs/modules/pointclouds/pcd/api-reference/pcd-writer'},
    {label: 'PCD module', to: '/docs/modules/pointclouds/pcd'}
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

`PCDLoader` parses point cloud data in the Point Cloud Data (PCD) format and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) by default.

Set `pcd.shape: 'mesh'` when a legacy [PointCloud](/docs/specifications/category-mesh) object is required.

| Shape         | Output             | Use when                                  |
| ------------- | ------------------ | ----------------------------------------- |
| `arrow-table` | `Mesh Arrow table` | You want columnar point cloud attributes. |
| `mesh`        | `PointCloud`       | You need the legacy point cloud object.   |

Note: Currently supports `ascii`, `binary` and compressed binary files.

## Usage

```typescript
import {PCDLoader} from '@loaders.gl/pointclouds/pcd';
import {load} from '@loaders.gl/core';

const data = await load(url, PCDLoader, options);
const table = await load(url, PCDLoader, {pcd: {shape: 'arrow-table'}});
```

## Batched Parsing

`PCDLoader` supports `loadInBatches` and `parseInBatches` for ASCII and uncompressed binary PCD data. When `pcd.shape: 'arrow-table'` is set, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table. Compressed binary PCD files fall back to a single parsed batch.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pointclouds/pcd';

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
| `pcd.shape` | `'mesh' \| 'arrow-table'` | `'arrow-table'` | Selects PointCloud or Mesh Arrow table output. |


## Worker batches

`PCDLoader` supports `parseInBatches()` on its built-in browser worker. The worker stays
leased for the input iterator and transfers owned Arrow column buffers. The caller
hydrates Mesh Arrow tables and performs any requested legacy `shape: 'mesh'` conversion.
Schemas and small loader/batch descriptors accompany the binary buffers; decoded row objects
are not sent from the worker. JSON conversion, if needed by an application, happens on the caller.

```typescript
const batches = await parseInBatches(input, PCDLoader, {
  core: {worker: true, batchSize: 1000},
  pcd: {shape: 'arrow-table'}
});
for await (const batch of batches) {
  consume(batch.data);
}
```

PCD currently collects the complete input before decoding. ASCII and uncompressed binary output is split by `core.batchSize`; compressed input may produce a single batch.

Cancellation uses the shared `signal` option. Aborting or ending iteration releases the worker;
transferred input buffers remain detached. Self-hosted workers must implement the batch protocol
and opt in with `core.workerInBatches: true`. Custom workers must use the current Arrow column wire format. This module ships a browser worker; Node workers require a compatible Node artifact.
The parser-bearing loader is available from `@loaders.gl/pointclouds/pcd/pcd-loader`.
