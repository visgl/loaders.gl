# NDJSONArrowLoader

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL) that returns Apache Arrow tables.

| Loader         | Characteristic                                                                           |
| -------------- | ---------------------------------------------------------------------------------------- |
| File Extension | `.ndjson`, `.jsonl`, `.ldjson`                                                           |
| Media Type     | `application/x-ndjson`, `application/x-ldjson`, `application/json-seq`                   |
| File Type      | Text                                                                                     |
| File Format    | [NDJSON][format_ndjson], [LDJSON][format_ldjson], [JSON Text Sequences][format_json_seq] |
| Data Format    | [Apache Arrow Table](/docs/developer-guide/apache-arrow)                                 |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                           |

[format_ndjson]: http://ndjson.org/
[format_ldjson]: http://ndjson.org/
[format_json_seq]: https://datatracker.ietf.org/doc/html/rfc7464

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {NDJSONArrowLoader} from '@loaders.gl/json';

const table = await load(url, NDJSONArrowLoader);

const idColumn = table.data.getChild('id');
const firstId = idColumn?.get(0);
```

`NDJSONArrowLoader` supports streaming NDJSON parsing. Each streamed batch is returned as an Apache Arrow table batch.

The parsed Arrow columns contain the same row values as [`NDJSONLoader`](/docs/modules/json/api-reference/ndjson-loader); use `NDJSONArrowLoader` when the consumer prefers columnar Apache Arrow data over object-row tables.

```typescript
import {loadInBatches} from '@loaders.gl/core';
import {NDJSONArrowLoader} from '@loaders.gl/json';

const batches = await loadInBatches('ndjson.ndjson', NDJSONArrowLoader, {
  batchSize: 1000
});

for await (const batch of batches) {
  // batch.data is an Apache Arrow Table
  const rowCount = batch.data.numRows;
}
```

## Options

Supports the table category options such as `batchSize`.
