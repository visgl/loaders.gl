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
  eyebrow="JSON module · table loader"
  title="JSONTableLoader"
  description="Load JSON row arrays into a table-shaped result every time, with optional Apache Arrow output and controlled conversion of nested values and types."
  tone="yellow"
  meta={['JSON rows', 'Arrow output', 'Streaming batches']}
  links={[
    {label: 'JSON format', to: '/docs/modules/json/formats/json'},
    {label: 'JSONLoader', to: '/docs/modules/json/api-reference/json-loader'},
    {label: 'JSON module', to: '/docs/modules/json'}
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

## Usage

Load object-row JSON as a table:

```typescript
import {JSONTableLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const table = await load(url, JSONTableLoader);
```

Request Apache Arrow output with `json.shape: 'arrow-table'`:

```typescript
const table = await load(url, JSONTableLoader, {
  json: {shape: 'arrow-table'}
});
```

Arrow conversion supports nested JSON fields, supplied loaders.gl or Apache Arrow schemas, strict validation by default, and opt-in recovery policies.

```typescript
const table = await load(url, JSONTableLoader, {
  json: {
    shape: 'arrow-table',
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

## Streaming

For larger JSON files, `JSONTableLoader` streams rows from one array. Set `json.jsonpaths` when the row array is embedded in a larger document.

```typescript
import {JSONTableLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('rows.json', JSONTableLoader, {
  json: {jsonpaths: ['$.items'], shape: 'arrow-table'}
});
```

Arrow `data` batches use a frozen schema. If `json.schema` is supplied, that schema is used for every batch. Otherwise the schema is inferred from the first non-empty `data` batch, and later batches are converted against it. Metadata batches remain container-oriented when `metadata: true` is enabled.

## Options

| Option                 | Type                                                       | Default                                                                                                                                 | Description |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `json.backend`         | `'clarinet' \| 'fast'`                                    | `'clarinet'`                                                                                                                            | Selects the streaming parser backend. |
| `json.shape`           | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'object-row-table'`                                                                                                                    | Selects the requested table output shape. |
| `json.schema`          | `Schema \| arrow.Schema`                                   | `undefined`                                                                                                                             | Optional schema used when `json.shape` is `'arrow-table'`. |
| `json.arrowConversion` | `object`                                                   | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}`         | Optional Arrow conversion policy. |
| `json.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'`                 | `'never'`                                                                                                                             | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode. |
| `json.jsonpaths`       | `string[]`                                                 | `[]`                                                                                                                                    | Arrays that can be streamed as row batches. |
| `metadata`             | `boolean`                                                  | `false`                                                                                                                                 | Emits container metadata batches for embedded streamed arrays. |
