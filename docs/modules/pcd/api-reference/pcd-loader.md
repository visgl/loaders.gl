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
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `pcd.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects PointCloud or Mesh Arrow table output. |
