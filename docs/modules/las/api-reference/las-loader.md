import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Loaders

<LasDocsTabs active="lasloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

:::caution
The default `laz-perf` backend only supports LAS/LAZ files up to LAS v1.3. Use `las.backend: 'copc'`, `las.backend: 'laz-rs'`, or `las.backend: 'typescript'` for LAS 1.4 point formats supported by those backends.
:::

`LASLoader` parses point clouds in the LASER file format into the legacy [PointCloud](/docs/specifications/category-mesh) object by default. Set `las.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

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

| Option                   | Type                 | Default    | Description                                                                                                                                                      |
| ------------------------ | -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.las.backend`    | `string`             | `laz-perf` | Decoder backend: `'laz-perf'` for the current vendored backend, `'copc'` for the COPC package laz-perf backend, `'laz-rs'` for the Rust/WASM backend, or `'typescript'` for the TypeScript backend. |
| `options.las.shape`      | `string`             | `mesh`     | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                                                                       |
| `options.las.fp64`       | `number`             | `false`    | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                                                                              |
| `options.las.colorDepth` | `number` or `string` | `8`        | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits.                                                   |
| `options.onProgress`     | `function`           | -          | Callback when a new chunk of data is read. Only works on the main thread.                                                                                        |

## TypeScript LAZ Streaming

With `las.backend: 'typescript'`, `parseInBatches` consumes compressed LAZ input incrementally. Legacy interleaved PDRF 0-3 chunks can emit complete Arrow batches before the current compressed chunk or file has finished arriving. PDRF 6, 7, and 8 table parsing emits after complete LAZ 1.4 chunks are available and selectively decodes the field layers represented by the returned Arrow schema without copying compressed field layers into temporary readers. PDRF 8 NIR and Extra Bytes remain available only through raw-record decoding because they are not yet represented in the returned Arrow schema. The raw chunk decoder remains available when complete LAS point records, including currently unexposed fields, are required.

Legacy point-level progress uses bounded geometric replay: when more compressed bytes arrive, the decoder replays previously emitted points through a record-sized scratch buffer and writes only new points into reusable output batches. This avoids committing partially mutated arithmetic state and bounds retry work to a linear factor of the compressed chunk size, but it retains the compressed chunk until completion. LAZ 1.4 layered PDRF 6-8 remains chunk-streaming because its independent field ranges must be available before complete rows can be assembled. Variable-size chunk point counts are stored in the LASzip chunk table at EOF, so a forward-only variable-chunk input is buffered until the table is available. See the [LAS/LAZ format implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for supported point formats and remaining limitations.
