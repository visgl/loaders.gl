# Apache Avro

`@loaders.gl/tables/avro` reads Apache Avro records into Arrow tables and writes Arrow tables as Avro Object Container Files (OCF).

## Installation and usage[​](#installation-and-usage "Direct link to Installation and usage")

```
npm install @loaders.gl/tables @loaders.gl/core
```

```
import {load, encode} from '@loaders.gl/core';

import {AvroLoader, AvroWriter} from '@loaders.gl/tables/avro';



const table = await load('records.avro', AvroLoader);

const bytes = await encode(table, AvroWriter);
```

The returned table has `shape: 'arrow-table'` and an Apache Arrow table in `data`. Avro binary fields without a recognized logical type use Arrow `Binary` for `bytes` and `FixedSizeBinary` for `fixed`. Each value retains its own length, including empty byte arrays and nullable values. These types also apply inside records, arrays, and maps.

Use `loadInBatches` with `AvroLoader` for Arrow table batches.

## Loader options[​](#loader-options "Direct link to Loader options")

Pass these options inside `avro`:

| Option         | Description                                                                           |
| -------------- | ------------------------------------------------------------------------------------- |
| `encoding`     | `'auto'` detects OCF and single-object encoding; `'raw'` requires an external schema. |
| `schema`       | External Avro schema for raw datum or single-object input.                            |
| `readerSchema` | Reader schema for projection and compatible schema evolution.                         |
| `longType`     | `'number'` by default; use `'bigint'` to preserve large 64-bit integer values.        |
| `batchSize`    | Maximum rows per batch.                                                               |
| `blockIndices` | Optional zero-based OCF block selection.                                              |

For standalone `.avsc` schema parsing, import `AvroSchemaLoaderWithParser` from `@loaders.gl/tables/avro/avro-schema-loader` and pass it to `load` or `parse`. The package-root `AvroSchemaLoader` contains metadata only.

See [table representations](https://loaders.gl/next/docs/specifications/category-table.md) and [streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md).
