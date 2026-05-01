import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetJSWriter

<ParquetDocsTabs active="parquetjswriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Experimental plain-table Parquet writer backed by the parquetjs implementation.

Use `ParquetJSWriter` when you explicitly want the parquetjs backend. For the default wasm-backed writer, use [`ParquetWriter`](/docs/modules/parquet/api-reference/parquet-writer).

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {ParquetJSWriter} from '@loaders.gl/parquet';

const parquetBuffer = await encode(table, ParquetJSWriter, {
  core: {worker: false},
  parquet: {
    rowGroupSize: 1000
  }
});
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.rowGroupSize` | `number` | implementation default | Target number of rows per row group. |
| `parquet.pageSize` | `number` | implementation default | Target encoded page size. |
| `parquet.useDataPageV2` | `boolean` | implementation default | Enables Data Page V2 output when supported. |

## Notes

- `ParquetJSWriter` writes plain loaders.gl tables and does not require Arrow input.
- The default wasm-backed `ParquetWriter` remains the canonical Parquet writer.
