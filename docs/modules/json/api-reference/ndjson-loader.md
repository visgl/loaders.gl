# NDJSON Loaders

Streaming loaders for NDJSON encoded files and related formats (LDJSON and JSONL).

| Loader              | Output                     | Use when                      |
| ------------------- | -------------------------- | ----------------------------- |
| `NDJSONLoader`      | `ObjectRowTable` batches   | You want JavaScript row data. |
| `NDJSONArrowLoader` | `ArrowTable` batches       | You want columnar batch data. |

| Characteristic | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| File Extension | `.ndjson`, `.jsonl`, `.ldjson`                                                         |
| Media Type     | `application/x-ndjson`, `application/x-ldjson`, `application/json-seq`                 |
| File Type      | Text                                                                                   |
| File Format    | [NDJSON][format_ndjson], [LDJSON][format_ldjson], [JSON Text Sequences][format_json_seq] |
| Data Format    | [Tables](/docs/specifications/category-table)                                          |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                         |

[format_ndjson]: http://ndjson.org/
[format_ldjson]: http://jsonlines.org/
[format_json_seq]: https://datatracker.ietf.org/doc/html/rfc7464

## NDJSONLoader

`NDJSONLoader` loads NDJSON data as loaders.gl row tables.

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

## NDJSONArrowLoader

`NDJSONArrowLoader` loads NDJSON data as loaders.gl `ArrowTable` objects that wrap Apache Arrow tables.

```typescript
import {load} from '@loaders.gl/core';
import {NDJSONArrowLoader} from '@loaders.gl/json';

const table = await load(url, NDJSONArrowLoader);

const idColumn = table.data.getChild('id');
const firstId = idColumn?.get(0);
```

`NDJSONArrowLoader` supports streaming NDJSON parsing. Each streamed batch is returned as an Apache Arrow table batch.

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

`NDJSONLoader` also returns Arrow tables when called with `ndjson.shape: 'arrow-table'`. In Arrow mode, `ndjson.schema` accepts either a loaders.gl `Schema` or Apache Arrow `Schema`. `ndjson.arrowConversion` has the same strict-by-default recovery policy as `JSONLoader`: type mismatches and missing fields throw unless configured to write `null` to nullable fields, and extra fields throw unless configured to drop. GeoJSON feature rows are converted as generic nested JSON rows; use `GeoJSONLoader` with `geojson.shape: 'arrow-table'` for GeoArrow WKB output.

## Data Format

Parsed `NDJSONLoader` batches are of the format.

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

| Option                   | Type                    | Default | Description |
| ------------------------ | ----------------------- | ------- | ----------- |
| `ndjson.shape`           | `string`                | `'object-row-table'` | Requested table shape. Supported values are `'object-row-table'`, `'array-row-table'`, and `'arrow-table'`. |
| `ndjson.schema`          | `Schema \| arrow.Schema` | `undefined` | Optional schema used when `ndjson.shape` is `'arrow-table'`. |
| `ndjson.arrowConversion` | `object`                | strict recovery policy | Optional Arrow conversion policy. Supports `onTypeMismatch`, `onMissingField`, `onExtraField`, and `logRecoveries`. |
