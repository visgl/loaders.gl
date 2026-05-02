import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Loaders

<LasDocsTabs active="lasloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

:::caution
The `@loaders.gl/las` module only supports LAS/lAZ files up to LAS v1.3. It does not support LAS v1.4 files.
For more detail, see the discussion in [Github Issues](https://github.com/visgl/loaders.gl/issues/591).
:::

`LASLoader` parses LAS/LAZ point clouds into the legacy [PointCloud](/docs/specifications/category-mesh) object by default. Set `las.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Loader           | Output             | Use when                                  |
| ---------------- | ------------------ | ----------------------------------------- |
| `LASLoader`      | `PointCloud \| Mesh Arrow table` | You want point cloud data as mesh or Arrow output. |

## Usage

```typescript
import {LASLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

const data = await load(url, LASLoader, options);
const table = await load(url, LASLoader, {
  las: {
    ...options?.las,
    shape: 'arrow-table'
  }
});
```

## Options

| Option                   | Type                 | Default | Description                                                                                                    |
| ------------------------ | -------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `options.las.shape`      | `string`             | `mesh`  | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                     |
| `options.las.skip`       | `number`             | `1`     | Read one from every _n_ points.                                                                                |
| `options.las.fp64`       | `number`             | `false` | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                            |
| `options.las.colorDepth` | `number` or `string` | `8`     | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits. |
| `options.onProgress`     | `function`           | -       | Callback when a new chunk of data is read. Only works on the main thread.                                      |
