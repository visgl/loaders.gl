---
title: NDJSONLoader
description: Stream newline-delimited JSON into rows or Arrow batches.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · streaming loader"
  title="NDJSONLoader"
  description="Read one JSON value per line and process the stream incrementally, with row-table defaults and optional Arrow batches for columnar pipelines."
  tone="yellow"
  meta={['NDJSON / JSONL', 'Streaming', 'Arrow output']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'JSONTableLoader', to: '/docs/modules/json/api-reference/json-table-loader'},
    {label: 'Parse in batches', to: '/docs/modules/core/api-reference/parse-in-batches'}
  ]}
/>

<JsonDocsTabs active="ndjsonloader" />

<DocOrientation
  eyebrow="What it reads"
  title="Treat each line as a record as soon as it arrives."
  description="NDJSON is deliberately line-oriented, which makes it a practical format for logs, exports, and large table streams. NDJSONLoader turns those lines into bounded batches."
  tone="yellow"
  items={[
    {label: 'Formats', value: 'NDJSON, JSONL, and LDJSON'},
    {label: 'Input', value: 'One JSON value per line'},
    {label: 'Output', value: 'Row tables or Arrow tables'},
    {label: 'APIs', value: 'Atomic and incremental loading'}
  ]}
/>

<ReferenceBoundary
  title="NDJSONLoader reference"
  description="The sections below cover format metadata, atomic and streaming usage, Arrow output, and parsing options."
  tone="yellow"
/>

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

`NDJSONLoader` loads NDJSON data as loaders.gl row tables by default and can also emit Apache Arrow tables with `ndjson.shape: 'arrow-table'`.

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

To request Arrow output, set `ndjson.shape: 'arrow-table'`.

```typescript
import {load, loadInBatches} from '@loaders.gl/core';
import {NDJSONLoader} from '@loaders.gl/json';

const table = await load(url, NDJSONLoader, {
  ndjson: {shape: 'arrow-table'}
});

const batches = await loadInBatches('ndjson.ndjson', NDJSONLoader, {
  batchSize: 1000,
  ndjson: {shape: 'arrow-table'}
});
```

`NDJSONLoader` also accepts the deprecated `json.shape` alias for shape selection. `ndjson.shape` takes precedence, and schema/recovery options remain under `ndjson.*`. In Arrow mode, `ndjson.schema` accepts either a loaders.gl `Schema` or Apache Arrow `Schema`. `ndjson.arrowConversion` has the same strict-by-default recovery policy as `JSONTableLoader`: type mismatches, missing fields, and integer conversion issues throw unless configured to recover, and extra fields throw unless configured to drop. GeoJSON feature rows are converted as generic nested JSON rows; use `GeoJSONLoader` with `geojson.shape: 'arrow-table'` for GeoArrow WKB output.

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
| `ndjson.arrowConversion` | `object`                | strict recovery policy | Optional Arrow conversion policy. Supports `onTypeMismatch`, `onMissingField`, `onExtraField`, `integerConversion`, and `logRecoveries`. |
| `ndjson.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'` | `'never'` | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode. |
| `json.shape`             | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'object-row-table'` | Deprecated alias for `ndjson.shape`; `ndjson.shape` takes precedence. |
