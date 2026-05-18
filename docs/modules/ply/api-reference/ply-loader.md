import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

# PLYLoader

<PlyDocsTabs active="plyloader" />

<p class="badges">
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
const packedTable = await load(url, PLYLoader, {
  ply: {shape: 'arrow-table', pointCloud: true, interleaved: true}
});
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

When `ply.interleaved: true` is enabled, `PLYLoader` allocates each packed vertex-record buffer up front and fills it directly while parsing fixed-width binary point-cloud vertex records. ASCII PLY and variable-width/list-property binary PLY currently remain on the standard paths. Packed output uses one `vertexData: FixedSizeBinary<byteStride>` Arrow column plus schema metadata and wrapper `packedLayout` metadata for `POSITION`, optional `NORMAL`, optional `TEXCOORD_0`, optional `COLOR_0`, and scalar custom vertex attributes.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `ply.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects Mesh or Mesh Arrow table output. |
| `ply.interleaved` | `boolean` | `false` | With `shape: 'arrow-table'`, returns direct-written packed records for fixed-width binary point-cloud PLY inputs. |
