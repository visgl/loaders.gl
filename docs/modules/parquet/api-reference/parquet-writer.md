# ParquetWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
	<img src="https://img.shields.io/badge/-BETA-teal.svg)](/studio/user-guide/import" alt="BETA" />
</p>

`ParquetWriter` accepts plain JS loaders.gl tables and converts them to Arrow before delegating to the wasm-backed `ParquetArrowWriter`.

`ParquetJSWriter` is the plain-table writer for the experimental parquetjs backend.

The legacy `ParquetJSONWriter` compatibility alias has been removed. Use `ParquetWriter`.

```typescript
import {ParquetWriter, ParquetJSWriter, ParquetArrowWriter} from '@loaders.gl/parquet';
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.wasmUrl` | `string` | bundled URL | Overrides the `parquet-wasm` binary URL for `ParquetWriter` and `ParquetArrowWriter`. |

## Backend Selection

- Use `ParquetWriter` for the default wasm-backed plain-table writer.
- Use `ParquetJSWriter` for the experimental parquetjs plain-table writer.
- Use `ParquetArrowWriter` for the wasm-backed Arrow-first writer.

## Supported Files

The Parquet format supports a large set of features (data types, encodings, compressions, encryptions etc) it require time and contributions for the loaders.gl implementation to provide support for all variations.

Please refer to the detailed information about which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.
