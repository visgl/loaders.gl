JSON module · table loader

[![](/images/format-logos/json-logo.gif)JSON](https://loaders.gl/docs/modules/tables/json/formats/json.md)

# JSONTableLoader

Load JSON row arrays into a table-shaped result every time, with optional Apache Arrow output and controlled conversion of nested values and types.

[JSON format](https://loaders.gl/docs/modules/tables/json/formats/json.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/tables/json/formats/json.md)[JSONLoader](https://loaders.gl/docs/modules/tables/json/api-reference/json-loader.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/tables/json/api-reference/json-loader.md)[JSON module](https://loaders.gl/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/tables/json.md)

[![](/images/format-logos/json-logo.gif)JSON](https://loaders.gl/docs/modules/tables/json/formats/json.md)[Try It](https://loaders.gl/examples/table/json)[Overview](https://loaders.gl/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/docs/modules/tables/json/api-reference/geojson-writer.md)

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

`JSONTableLoader` is the table-focused counterpart to [`JSONLoader`](https://loaders.gl/docs/modules/tables/json/api-reference/json-loader.md). It accepts JSON row arrays or JSON documents that contain a row array, and it always returns a row table or Apache Arrow table. Use `JSONLoader` for arbitrary JSON documents.

| JSONTableLoader |                                                                    |
| --------------- | ------------------------------------------------------------------ |
| File Extension  | `.json`                                                            |
| Media Type      | `application/json`                                                 |
| File Type       | Text                                                               |
| File Format     | [JSON](https://www.json.org/json-en.html)                          |
| Data Format     | [Tables](https://loaders.gl/docs/specifications/category-table.md) |
| Supported APIs  | `load`, `parse`, `parseSync`, `parseInBatches`                     |

## Already have parsed JSON or application-built rows?[​](#already-have-parsed-json-or-application-built-rows "Direct link to Already have parsed JSON or application-built rows?")

Use [`convertJSONToArrow`](https://loaders.gl/docs/modules/tables/json/api-reference/convert-json-to-arrow.md) to convert rows directly, without a stringify/parse round trip. It shares this loader's schema inference and conversion policies.

```
import {convertJSONToArrow} from '@loaders.gl/tables/json';



const rows = [{name: 'Oslo', population: 717710}];

const table = convertJSONToArrow(rows);

console.log(table.getChild('name')?.get(0)); // 'Oslo'
```

Both the converter and this loader's `json.shape: 'arrow'` output return a native Apache Arrow `Table`. The converter accepts flat `{schema, arrowConversion, log}` options; see its [full reference](https://loaders.gl/docs/modules/tables/json/api-reference/convert-json-to-arrow.md) for nested inputs, explicit schemas, recovery policies, and deck.gl `dataTransform` examples.

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

## Query a JSON table source[​](#query-a-json-table-source "Direct link to Query a JSON table source")

Use `JSONTableLoader` with the loaders.gl query API to select and rename fields. For array rows with no supplied schema, generated fields are named `column1`, `column2`, and so on (1-based), matching headerless CSV. A supplied schema takes precedence.

```
import {query} from '@loaders.gl/core/query';

import {JSONTableLoader} from '@loaders.gl/tables/json';



const table = await query(

  {select: [{as: 'longitude', column: 'column1'}]},

  {source: url, loaders: JSONTableLoader}

);
```

Use `createDataSource(input, [JSONTableLoader, CSVLoader])` to select a source from multiple loaders. JSON is identified by a `.json` filename or a Blob with the `application/json` MIME type. Pass `JSONTableLoader` directly for an unnamed Blob without a MIME type when the input is known to be JSON.

The source downloads and decodes the entire JSON document before applying filters, projections, or limits.

## Streaming[​](#streaming "Direct link to Streaming")

For larger JSON files, `JSONTableLoader` streams rows from one array. Set `json.jsonpaths` when the row array is embedded in a larger document.

```
import {JSONTableLoader} from '@loaders.gl/tables/json';

import {loadInBatches} from '@loaders.gl/core';



const batches = await loadInBatches('rows.json', JSONTableLoader, {

  json: {jsonpaths: ['$.items'], shape: 'arrow'}

});
```

Arrow batches are native `RecordBatch` objects with a fixed column structure. A supplied `json.schema` determines that structure; otherwise it is inferred from the first nonempty batch. Each batch retains a metadata snapshot. Container properties accumulate in `schema.metadata.get('loaders.gl.containerJson')`, and a zero-row final batch carries any trailing refinements. Empty inputs retain their declared schema. The selected JSON path is available in `batch.metadata.get('jsonpath')`.

## Options[​](#options "Direct link to Options")

| Option                           | Type                                                 | Default                                                                                                                      | Description                                                                                                              |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `json.backend`                   | `'clarinet' \| 'fast'`                               | `'clarinet'`                                                                                                                 | Selects the streaming parser backend.                                                                                    |
| `json.shape`                     | `'arrow' \| 'object-row-table' \| 'array-row-table'` | `'arrow'`                                                                                                                    | Selects the requested table output shape.                                                                                |
| `json.schema`                    | `Schema \| arrow.Schema`                             | `undefined`                                                                                                                  | Optional schema used when `json.shape` is `'arrow'`.                                                                     |
| `json.arrowConversion`           | `object`                                             | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}` | Optional Arrow conversion policy.                                                                                        |
| `json.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'`                   | `'never'`                                                                                                                    | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode.            |
| `json.jsonpaths`                 | `string[]`                                           | `[]`                                                                                                                         | Arrays that can be streamed as row batches.                                                                              |
| `metadata`                       | `boolean`                                            | `false`                                                                                                                      | Emits container metadata envelopes for explicit row-table output. Arrow output carries container metadata in its schema. |

## Worker batches[​](#worker-batches "Direct link to Worker batches")

This loader supports stateful worker batch parsing with `core.worker: true`, cancellation via `signal`, and decoded-row progress via `onProgress`. See [JSON worker batches](https://loaders.gl/docs/modules/tables/json.md#parsing-batches-in-workers) for streaming behavior, schemas, backpressure, and Node/custom-worker options.

Arrow tables return as directly transferred column buffers. Row tables and container metadata return as binary JSON frames decoded on the caller, preserving heterogeneous values without Arrow coercion. Decoded row objects are never structured-cloned across the worker boundary.
