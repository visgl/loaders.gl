JSON module · table loader

![](/next/images/format-logos/json-logo.gif)JSON

# JSONTableLoader

Load JSON row arrays into a table-shaped result every time, with optional Apache Arrow output and controlled conversion of nested values and types.

[JSON format](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it returns

## Make the table contract explicit at the JSON boundary.

JSONTableLoader is for JSON that represents records. It keeps the familiar row path while allowing applications to request Arrow columns and define how conversion mismatches are handled.

01

Rows

Object or array row tables

02

Arrow

Typed columns and record batches

03

Schema

Optional supplied loaders.gl or Arrow schema

04

Streaming

Incremental batches from row arrays

Detailed guide

## JSONTableLoader reference

The sections below cover usage, output shapes, Arrow conversion, streaming, and mismatch policies.

Streaming loader for JSON files that must resolve to loaders.gl table output.

`JSONTableLoader` is the table-focused counterpart to [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md). It accepts JSON row arrays or JSON documents that contain a row array, and it always returns a row table or Apache Arrow table. Use `JSONLoader` for arbitrary JSON documents.

| JSONTableLoader |                                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| File Extension  | `.json`                                                                      |
| Media Type      | `application/json`                                                           |
| File Type       | Text                                                                         |
| File Format     | [JSON](https://www.json.org/json-en.html)                                    |
| Data Format     | [Tables](https://loaders.gl/next/docs/specifications/category-table.md) |
| Supported APIs  | `load`, `parse`, `parseSync`, `parseInBatches`                               |

## Usage[​](#usage "Direct link to Usage")

Load JSON as an Arrow table (the default):

```
import {JSONTableLoader} from '@loaders.gl/tables/json';

import {load} from '@loaders.gl/core';



const table = await load(url, JSONTableLoader);
```

Request object rows with `json.shape: 'object-row-table'`:

```
const table = await load(url, JSONTableLoader, {

  json: {shape: 'object-row-table'}

});
```

Arrow conversion supports nested JSON fields, supplied loaders.gl or Apache Arrow schemas, strict validation by default, and opt-in recovery policies.

```
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

## Streaming[​](#streaming "Direct link to Streaming")

For larger JSON files, `JSONTableLoader` streams rows from one array. Set `json.jsonpaths` when the row array is embedded in a larger document.

```
import {JSONTableLoader} from '@loaders.gl/tables/json';

import {loadInBatches} from '@loaders.gl/core';



const batches = await loadInBatches('rows.json', JSONTableLoader, {

  json: {jsonpaths: ['$.items'], shape: 'arrow-table'}

});
```

Arrow `data` batches use a frozen schema. If `json.schema` is supplied, that schema is used for every batch. Otherwise the schema is inferred from the first non-empty `data` batch, and later batches are converted against it. Metadata batches remain container-oriented when `metadata: true` is enabled.

## Options[​](#options "Direct link to Options")

| Option                           | Type                                                       | Default                                                                                                                      | Description                                                                                                   |
| -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `json.backend`                   | `'clarinet' \| 'fast'`                                     | `'clarinet'`                                                                                                                 | Selects the streaming parser backend.                                                                         |
| `json.shape`                     | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'arrow-table'`                                                                                                              | Selects the requested table output shape.                                                                     |
| `json.schema`                    | `Schema \| arrow.Schema`                                   | `undefined`                                                                                                                  | Optional schema used when `json.shape` is `'arrow-table'`.                                                    |
| `json.arrowConversion`           | `object`                                                   | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}` | Optional Arrow conversion policy.                                                                             |
| `json.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'`                         | `'never'`                                                                                                                    | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode. |
| `json.jsonpaths`                 | `string[]`                                                 | `[]`                                                                                                                         | Arrays that can be streamed as row batches.                                                                   |
| `metadata`                       | `boolean`                                                  | `false`                                                                                                                      | Emits container metadata batches for embedded streamed arrays.                                                |

## Worker batches[​](#worker-batches "Direct link to Worker batches")

This loader supports stateful worker batch parsing with `core.worker: true`, cancellation via `signal`, and decoded-row progress via `onProgress`. See [JSON worker batches](https://loaders.gl/next/docs/modules/tables/json.md#parsing-batches-in-workers) for streaming behavior, schemas, backpressure, and Node/custom-worker options.

Arrow tables return as directly transferred column buffers. Row tables and container metadata return as binary JSON frames decoded on the caller, preserving heterogeneous values without Arrow coercion. Decoded row objects are never structured-cloned across the worker boundary.
