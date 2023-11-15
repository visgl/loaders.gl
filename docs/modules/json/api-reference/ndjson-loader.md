# NDJSONLoader

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).


| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.ndjson`, `.jsonl`, `.ldjson`                       |
| Media Type     | `application/x-ndjson`, `application/x-ldjson`, `application/json-seq` |
| File Type      | Text                                                 |
| File Format    | [NDJSON][format_ndjson], [LDJSON][format_], [][format_] |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

[format_ndjson]: http://ndjson.org/
[format_ldjson]: http://ndjson.org/
[format_jsonjson]: http://ndjson.org/

## Usage

```typescript
import {NDJSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, NDJSONLoader, {ndjson: options});
```

The NDJSONLoader supports streaming NDJSON parsing, in which case it will yield "batches" of rows, where each row is a parsed line from the NDJSON stream.

```typescript
import {NDJSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('ndjson.ndjson', NDJSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const obj of batch.data) {
    // Process obj
    ...
  }
}
```

## Data Format

Parsed batches are of the format.

```ts
{
  // standard batch payload
  data: any[] | any;
  bytesUsed: number;
  batchCount: number;
}
```

Each element in the `data` array corresponds to a line (Object) in the NDJSON data.

## Options

Supports the table category options such as `batchSize`.
