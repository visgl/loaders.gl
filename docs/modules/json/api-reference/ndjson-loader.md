# NDJSONLoader

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).

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

`NDJSONLoader` loads NDJSON data as loaders.gl row tables by default and can also emit Apache Arrow tables with `json.shape: 'arrow-table'`.

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

To request Arrow output, set `json.shape: 'arrow-table'`.

```typescript
import {load, loadInBatches} from '@loaders.gl/core';
import {NDJSONLoader} from '@loaders.gl/json';

const table = await load(url, NDJSONLoader, {
  json: {shape: 'arrow-table'}
});

const batches = await loadInBatches('ndjson.ndjson', NDJSONLoader, {
  batchSize: 1000,
  json: {shape: 'arrow-table'}
});
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

<<<<<<< HEAD
| Option                   | Type                    | Default | Description |
| ------------------------ | ----------------------- | ------- | ----------- |
| `ndjson.shape`           | `string`                | `'object-row-table'` | Requested table shape. Supported values are `'object-row-table'`, `'array-row-table'`, and `'arrow-table'`. |
| `ndjson.schema`          | `Schema \| arrow.Schema` | `undefined` | Optional schema used when `ndjson.shape` is `'arrow-table'`. |
| `ndjson.arrowConversion` | `object`                | strict recovery policy | Optional Arrow conversion policy. Supports `onTypeMismatch`, `onMissingField`, `onExtraField`, and `logRecoveries`. |
=======
| Option       | From                                                                                       | Type                                                 | Default              | Description                                         |
| ------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------- | --------------------------------------------------- |
| `json.shape` | [![Website shields.io](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)](http://shields.io) | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `object-row-table` | Selects row-table output or Apache Arrow output. |
>>>>>>> master
