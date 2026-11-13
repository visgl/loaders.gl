---
title: JSONTableLoader
description: Load JSON row arrays into loaders.gl row or Arrow tables.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="json"
  eyebrow="JSON module · table loader"
  title="JSONTableLoader"
  description="Load JSON row arrays into a table-shaped result every time, with optional Apache Arrow output and controlled conversion of nested values and types."
  tone="yellow"
  meta={['JSON rows', 'Arrow output', 'Streaming batches']}
  links={[
    {label: 'JSON format', to: '/docs/modules/tables/json/formats/json'},
    {label: 'JSONLoader', to: '/docs/modules/tables/json/api-reference/json-loader'},
    {label: 'JSON module', to: '/docs/modules/tables/json'}
  ]}
/>

<JsonDocsTabs active="jsontableloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Make the table contract explicit at the JSON boundary."
  description="JSONTableLoader is for JSON that represents records. It keeps the familiar row path while allowing applications to request Arrow columns and define how conversion mismatches are handled."
  tone="yellow"
  items={[
    {label: 'Rows', value: 'Object or array row tables'},
    {label: 'Arrow', value: 'Typed columns and record batches'},
    {label: 'Schema', value: 'Optional supplied loaders.gl or Arrow schema'},
    {label: 'Streaming', value: 'Incremental batches from row arrays'}
  ]}
/>

<ReferenceBoundary
  title="JSONTableLoader reference"
  description="The sections below cover usage, output shapes, Arrow conversion, streaming, and mismatch policies."
  tone="yellow"
/>

Streaming loader for JSON files that must resolve to loaders.gl table output.

`JSONTableLoader` is the table-focused counterpart to [`JSONLoader`](./json-loader). It accepts JSON row arrays or JSON documents that contain a row array, and it always returns a row table or Apache Arrow table. Use `JSONLoader` for arbitrary JSON documents.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.json`                                              |
| Media Type     | `application/json`                                   |
| File Type      | Text                                                 |
| File Format    | [JSON](https://www.json.org/json-en.html)            |
| Data Format    | [Tables](/docs/specifications/category-table)        |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Already have parsed JSON or application-built rows?

Use [`convertJSONToArrow`](./convert-json-to-arrow.md) to convert rows directly, without a
stringify/parse round trip. It shares this loader's schema inference and conversion policies.

```typescript
import {convertJSONToArrow} from '@loaders.gl/tables/json-table-loader';

const rows = [{name: 'Oslo', population: 717710}];
const table = convertJSONToArrow(rows);
console.log(table.getChild('name')?.get(0)); // 'Oslo'
```

Both the converter and this loader's `json.shape: 'arrow'` output return a native Apache Arrow `Table`. The converter accepts
flat `{schema, arrowConversion, log}` options; see its [full reference](./convert-json-to-arrow.md)
for nested inputs, explicit schemas, recovery policies, and deck.gl `dataTransform` examples.

## Usage

Load JSON as an Arrow table (the default):

```typescript
import {JSONTableLoader} from '@loaders.gl/tables/json';
import {load} from '@loaders.gl/core';

const table = await load(url, JSONTableLoader);
```

Request object rows with `json.shape: 'object-row-table'`:

```typescript
const table = await load(url, JSONTableLoader, {
  json: {shape: 'object-row-table'}
});
```

Arrow conversion supports nested JSON fields, supplied loaders.gl or Apache Arrow schemas, strict validation by default, and opt-in recovery policies.

```typescript
const table = await load(url, JSONTableLoader, {
  json: {
    shape: 'arrow',
    schema,
    arrowConversion: {
      onTypeMismatch: 'null',
      onMissingField: 'null',
      onExtraField: 'drop',
      integerConversion: 'warn'
    }
  }
});
```

Recovered Arrow conversion issues are logged once per issue kind and field path through `options.core.log`.

If the selected JSON value is not a row array, atomic parsing throws instead of returning raw JSON. This keeps the loader contract table-only.

## Query a JSON table source

Use `JSONTableLoader` with the loaders.gl query API to select and rename fields.
For array rows with no supplied schema, generated fields are named `column1`, `column2`, and so on (1-based), matching headerless CSV. A supplied schema takes precedence.

```typescript
import {query} from '@loaders.gl/core/scan';
import {JSONTableLoader} from '@loaders.gl/tables/json';

const table = await query(
  {select: [{as: 'longitude', column: 'column1'}]},
  {source: url, loaders: JSONTableLoader}
);
```

Use `createDataSource(input, [JSONTableLoader, CSVLoader])` to select a source from
multiple loaders. JSON is identified by a `.json` filename or a Blob with the
`application/json` MIME type. Pass `JSONTableLoader` directly for an unnamed Blob
without a MIME type when the input is known to be JSON.

The source downloads and decodes the entire JSON document before applying filters,
projections, or limits.

## Streaming

For larger JSON files, `JSONTableLoader` streams rows from one array. Set `json.jsonpaths` when the row array is embedded in a larger document.

```typescript
import {JSONTableLoader} from '@loaders.gl/tables/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('rows.json', JSONTableLoader, {
  json: {jsonpaths: ['$.items'], shape: 'arrow'}
});
```

Arrow batches are native `RecordBatch` objects with a fixed column structure. A supplied `json.schema` determines that structure; otherwise it is inferred from the first nonempty batch. Each batch retains a metadata snapshot. Container properties accumulate in `schema.metadata.get('loaders.gl.containerJson')`, and a zero-row final batch carries any trailing refinements. Empty inputs retain their declared schema. The selected JSON path is available in `batch.metadata.get('jsonpath')`.

## Options

| Option                 | Type                                                       | Default                                                                                                                                 | Description |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `json.backend`         | `'clarinet' \| 'fast'`                                    | `'clarinet'`                                                                                                                            | Selects the streaming parser backend. |
| `json.shape`           | `'arrow' \| 'object-row-table' \| 'array-row-table'` | `'arrow'` | Selects the requested table output shape. |
| `json.schema`          | `Schema \| arrow.Schema`                                   | `undefined`                                                                                                                             | Optional schema used when `json.shape` is `'arrow'`. |
| `json.arrowConversion` | `object`                                                   | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}`         | Optional Arrow conversion policy. |
| `json.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'`                 | `'never'`                                                                                                                             | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode. |
| `json.jsonpaths`       | `string[]`                                                 | `[]`                                                                                                                                    | Arrays that can be streamed as row batches. |
| `metadata`             | `boolean`                                                  | `false`                                                                                                                                 | Emits container metadata envelopes for explicit row-table output. Arrow output carries container metadata in its schema. |

## Worker batches

This loader supports stateful worker batch parsing with `core.worker: true`, cancellation via
`signal`, and decoded-row progress via `onProgress`. See [JSON worker batches](/docs/modules/tables/json#parsing-batches-in-workers)
for streaming behavior, schemas, backpressure, and Node/custom-worker options.

Arrow tables return as directly transferred column buffers. Row tables and container metadata return as
binary JSON frames decoded on the caller, preserving heterogeneous values without Arrow coercion.
Decoded row objects are never structured-cloned across the worker boundary.
