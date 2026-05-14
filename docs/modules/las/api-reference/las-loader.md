import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Loaders

<LasDocsTabs active="lasloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `LASLoader` parses a point cloud in the LASER file format.

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
const packedTable = await load(url, LASLoader, {
  las: {
    shape: 'arrow-table',
    interleaved: true
  }
});
```

## Options

| Option                   | Type                 | Default | Description                                                                                                    |
| ------------------------ | -------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `options.las.backend`    | `string`             | `laz-perf` | Decoder backend: `'laz-perf'` for the current vendored backend, `'copc'` for the COPC package laz-perf backend, or `'laz-rs'` for the Rust/WASM backend. |
| `options.las.shape`      | `string`             | `mesh`  | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                     |
| `options.las.interleaved` | `boolean`           | `false` | With `shape: 'arrow-table'`, return packed `FixedSizeBinary` vertex records plus GPU buffer layout metadata. Supported only by the default `laz-perf` backend and incompatible with `fp64: true`. |
| `options.las.skip`       | `number`             | `1`     | Read one from every _n_ points.                                                                                |
| `options.las.fp64`       | `number`             | `false` | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                            |
| `options.las.colorDepth` | `number` or `string` | `8`     | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits. |
| `options.onProgress`     | `function`           | -       | Callback when a new chunk of data is read. Only works on the main thread.                                      |

When `las.interleaved: true` is enabled, `LASLoader` returns a packed-only Mesh Arrow table with one `vertexData: FixedSizeBinary<byteStride>` column. The Arrow schema metadata stores the packed buffer name, byte stride, and attribute views for `POSITION`, optional `COLOR_0`, `intensity`, and `classification`; the loaders.gl wrapper mirrors that layout as `packedLayout`.
