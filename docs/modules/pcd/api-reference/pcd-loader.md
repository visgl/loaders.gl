import {PcdDocsTabs} from '@site/src/components/docs/pcd-docs-tabs';

# PCD Loaders

<PcdDocsTabs active="pcdloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

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
const packedTable = await load(url, PCDLoader, {
  pcd: {shape: 'arrow-table', interleaved: true}
});
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

When `pcd.interleaved: true` is enabled, `PCDLoader` allocates each packed vertex-record buffer up front and writes point data into that buffer during parsing. Packed output uses one `vertexData: FixedSizeBinary<byteStride>` Arrow column plus schema metadata and wrapper `packedLayout` metadata for `POSITION`, optional `NORMAL`, and optional `COLOR_0`.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `pcd.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects PointCloud or Mesh Arrow table output. |
| `pcd.interleaved` | `boolean` | `false` | With `shape: 'arrow-table'`, returns direct-written packed point records for GPU buffer upload. |
