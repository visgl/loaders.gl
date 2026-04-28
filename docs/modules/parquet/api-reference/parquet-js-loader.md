import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetJSLoader

<ParquetDocsTabs active="parquetjsloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Experimental plain-row Parquet loader backed by the parquetjs implementation.

Use `ParquetJSLoader` when you explicitly want the parquetjs backend. For the default wasm-backed loader, use [`ParquetLoader`](/docs/modules/parquet/api-reference/parquet-loader).

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {ParquetJSLoader} from '@loaders.gl/parquet';

const table = await load(url, ParquetJSLoader, {
  parquet: {
    columns: ['id', 'name'],
    limit: 100
  }
});
```

## Output

`ParquetJSLoader` returns an `object-row-table`.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.limit` | `number` | `undefined` | Maximum number of rows to return. |
| `parquet.offset` | `number` | `0` | Number of rows to skip before returning data. |
| `parquet.batchSize` | `number` | `undefined` | Target number of rows per batch when streaming. |
| `parquet.columns` | `string[]` | `undefined` | Restrict parsing to the listed columns. |
| `parquet.preserveBinary` | `boolean` | `false` | Preserve unannotated Parquet byte columns as `Uint8Array` values. |

## Notes

- `ParquetJSLoader` is experimental and does not replace the default wasm-backed `ParquetLoader`.
- GeoParquet Arrow metadata annotation is only available through the Arrow-reading wasm path.
