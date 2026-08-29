---
title: JSONLoader
description: Parse JSON documents or stream arrays into loaders.gl data.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · loader API"
  title="JSONLoader"
  description="Parse arbitrary JSON documents, or stream rows from an array inside a larger document when the payload is too large to process as one blocking operation."
  tone="yellow"
  meta={['JSON documents', 'Streaming arrays', 'From v1.0']}
  links={[
    {label: 'JSON format', to: '/docs/modules/json/formats/json'},
    {label: 'JSONTableLoader', to: '/docs/modules/json/api-reference/json-table-loader'},
    {label: 'JSON module', to: '/docs/modules/json'}
  ]}
/>

<JsonDocsTabs active="jsonloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Preserve the document—or stream the records inside it."
  description="JSONLoader handles arbitrary JSON values while retaining a compatibility path for arrays and JSONPath-selected row streams. Use JSONTableLoader when table output is the contract."
  tone="yellow"
  items={[
    {label: 'Documents', value: 'Objects, arrays, and scalar JSON values'},
    {label: 'Rows', value: 'Arrays extracted as loaders.gl batches'},
    {label: 'GeoJSON', value: 'Feature arrays selected by JSONPath'},
    {label: 'APIs', value: 'load, parse, sync, and batch parsing'}
  ]}
/>

<ReferenceBoundary
  title="JSONLoader reference"
  description="The sections below cover format metadata, atomic and streaming usage, JSONPath selection, and loader options."
  tone="yellow"
/>

Streaming loader for JSON encoded files.

`JSONLoader` loads arbitrary JSON documents. For compatibility with earlier loaders.gl releases, it can also extract arrays as loaders.gl row tables and stream rows from arrays inside larger JSON documents. Use [`JSONTableLoader`](./json-table-loader) when the loader contract must always return a table or when Apache Arrow output is required.

| Loader         | Characteristic                                 |
| -------------- | ---------------------------------------------- |
| File Extension | `.json`                                        |
| Media Type     | `application/json`                             |
| File Type      | Text                                           |
| File Format    | [JSON](https://www.json.org/json-en.html)      |
| Data Format    | JSON documents, optional row tables             |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches` |

## Usage

For simple usage, load and parse a JSON file atomically:

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

For larger files, `JSONLoader` supports streaming JSON parsing. It yields batches of rows from one array. To parse a stream of GeoJSON, specify `options.json.jsonpaths` to stream the `features` array.

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader, {json: {jsonpaths: ['$.features']}});

for await (const batch of batches) {
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
        // Handle polygon
        break;
    }
  }
}
```

If no JSONPath is specified, the loader streams the first array it encounters in the JSON payload.

For faster opt-in streaming extraction, set `json.backend: 'fast'`. This affects streaming parsing only; atomic JSON parsing still uses `JSON.parse`.

```typescript
const batches = await loadInBatches('geojson.json', JSONLoader, {
  json: {backend: 'fast', jsonpaths: ['$.features']}
});
```

### Metadata Batches

When batch parsing an embedded JSON array as a table, set `metadata: true` to access the containing object. The loader yields an initial and final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result`.

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader, {metadata: true});

for await (const batch of batches) {
  switch (batch.batchType) {
    case 'partial-result':
    case 'final-result':
      console.log(batch.container);
      break;
    case 'data':
      for (const feature of batch.data) {
        // Process streamed rows
      }
      break;
  }
}
```

### Streaming Semantics

- `JSONLoader` streams rows from a single JSON array. Every `batch.data` entry in a `data` batch is a complete row that the streaming parser has fully parsed before it is emitted.
- If `metadata: true` is set, the loader also yields `partial-result` and `final-result` batches that intentionally exclude the streamed array from `batch.container`. These batches describe only the surrounding container object; the streamed rows remain in the `data` batches.

To avoid confusion when inspecting batches:

1. Consume `batch.data` only when `batch.batchType === 'data'`; metadata batches appear incomplete by design because they omit the streamed array.
2. If you need the full root object after streaming, enable `metadata: true` and merge the streamed `data` rows back into the container object instead of relying on the metadata batches alone.

## Data Format

Parsed batches are of the format:

```ts
{
  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;
  jsonpath: string;

  data: any[] | any;
  bytesUsed: number;
  batchCount: number;
}
```

## JSONLoader Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type                                                       | Default                                                                                                                                            | Description                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`           | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`                                                  | `false`                                                                                                                                            | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing.             |
| `json.backend`         | [![Website shields.io](https://img.shields.io/badge/Experimental-orange.svg?style=flat-square)] | `'clarinet' \| 'fast'` | `'clarinet'` | Selects the streaming parser backend. Set to `'fast'` to opt into the faster streaming extractor. |
| `json.shape`           |                                                                                       | `'object-row-table' \| 'array-row-table'`                  | `undefined`                                                                                                                                        | Selects row-table output for compatibility with existing table extraction workflows.                                                             |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]`                                                 | `[]`                                                                                                                                               | A list of JSON paths indicating the array that can be streamed.                                                                                   |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`                                                  | If `true`, yields an initial and final batch containing the partial and final result, i.e. the root object excluding the array being streamed.       |

## JSONPaths

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](../jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
