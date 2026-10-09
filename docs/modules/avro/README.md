---
title: Avro module
---

# Apache Avro

`@loaders.gl/avro` reads Apache Avro records into Arrow tables and writes Arrow
tables as Avro Object Container Files (OCF).

## Installation and usage

```bash
npm install @loaders.gl/avro @loaders.gl/core
```

```typescript
import {load, encode} from '@loaders.gl/core';
import {AvroLoader, AvroWriter} from '@loaders.gl/avro';

const table = await load('records.avro', AvroLoader);
const bytes = await encode(table, AvroWriter);
```

The returned table has `shape: 'arrow-table'` and an Apache Arrow table in `data`.
Use `loadInBatches` with `AvroLoader` for Arrow table batches.

## Loader options

Pass these options inside `avro`:

| Option | Description |
| --- | --- |
| `encoding` | `'auto'` detects OCF and single-object encoding; `'raw'` requires an external schema. |
| `schema` | External Avro schema for raw datum or single-object input. |
| `readerSchema` | Reader schema for projection and compatible schema evolution. |
| `longType` | `'number'` by default; use `'bigint'` to preserve large 64-bit integer values. |
| `batchSize` | Maximum rows per batch. |
| `blockIndices` | Optional zero-based OCF block selection. |

For standalone `.avsc` schema parsing, import `AvroSchemaLoaderWithParser` from
`@loaders.gl/avro/avro-schema-loader` and pass it to `load` or `parse`.
The package-root `AvroSchemaLoader` contains metadata only.

See [table representations](/docs/specifications/category-table) and
[streaming loaders](/docs/developer-guide/using-streaming-loaders).
