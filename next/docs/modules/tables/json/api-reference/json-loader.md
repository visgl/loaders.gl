JSON module · loader API

![](/next/images/format-logos/json-logo.gif)JSON

# JSONLoader

Parse arbitrary JSON documents, or stream rows from an array inside a larger document when the payload is too large to process as one blocking operation.

[JSON format](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it returns

## Preserve the document—or stream the records inside it.

JSONLoader handles arbitrary JSON values while retaining a compatibility path for arrays and JSONPath-selected row streams. Use JSONTableLoader when table output is the contract.

01

Documents

Objects, arrays, and scalar JSON values

02

Rows

Arrays extracted as loaders.gl batches

03

GeoJSON

Feature arrays selected by JSONPath

04

APIs

load, parse, sync, and batch parsing

Detailed guide

## JSONLoader reference

The sections below cover format metadata, atomic and streaming usage, JSONPath selection, and loader options.

Streaming loader for JSON encoded files.

`JSONLoader` loads arbitrary JSON documents. For compatibility with earlier loaders.gl releases, it can also extract arrays as loaders.gl row tables and stream rows from arrays inside larger JSON documents. Use [`JSONTableLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md) when the loader contract must always return a table or when Apache Arrow output is required.

| JSONLoader     |                                                |
| -------------- | ---------------------------------------------- |
| File Extension | `.json`                                        |
| Media Type     | `application/json`                             |
| File Type      | Text                                           |
| File Format    | [JSON](https://www.json.org/json-en.html)      |
| Data Format    | JSON documents, optional row tables            |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches` |

## Usage[​](#usage "Direct link to Usage")

For simple usage, load and parse a JSON file atomically:

```
import {JSONLoader} from '@loaders.gl/tables/json';

import {load} from '@loaders.gl/core';



const data = await load(url, JSONLoader, {json: options});
```

For larger files, `JSONLoader` supports streaming JSON parsing. It yields batches of rows from one array. To parse a stream of GeoJSON, specify `options.json.jsonpaths` to stream the `features` array.

```
import {JSONLoader} from '@loaders.gl/tables/json';

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

```
const batches = await loadInBatches('geojson.json', JSONLoader, {

  json: {backend: 'fast', jsonpaths: ['$.features']}

});
```

### Metadata Batches[​](#metadata-batches "Direct link to Metadata Batches")

When batch parsing an embedded JSON array as a table, set `metadata: true` to access the containing object. The loader yields an initial and final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result`.

```
import {JSONLoader} from '@loaders.gl/tables/json';

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

### Streaming Semantics[​](#streaming-semantics "Direct link to Streaming Semantics")

* `JSONLoader` streams rows from a single JSON array. Every `batch.data` entry in a `data` batch is a complete row that the streaming parser has fully parsed before it is emitted.
* If `metadata: true` is set, the loader also yields `partial-result` and `final-result` batches that intentionally exclude the streamed array from `batch.container`. These batches describe only the surrounding container object; the streamed rows remain in the `data` batches.

To avoid confusion when inspecting batches:

1. Consume `batch.data` only when `batch.batchType === 'data'`; metadata batches appear incomplete by design because they omit the streamed array.
2. If you need the full root object after streaming, enable `metadata: true` and merge the streamed `data` rows back into the container object instead of relying on the metadata batches alone.

## Data Format[​](#data-format "Direct link to Data Format")

Parsed batches are of the format:

```
{

  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;

  jsonpath: string;



  data: any[] | any;

  bytesUsed: number;

  batchCount: number;

}
```

## JSONLoader Options[​](#jsonloader-options "Direct link to JSONLoader Options")

Supports table category options such as `batchType` and `batchSize`.

| Option           | From                                                                                             | Type                                      | Default      | Description                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`     | \[![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)]           | `boolean`                                 | `false`      | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing.          |
| `json.backend`   | \[![Website shields.io](https://img.shields.io/badge/Experimental-orange.svg?style=flat-square)] | `'clarinet' \| 'fast'`                    | `'clarinet'` | Selects the streaming parser backend. Set to `'fast'` to opt into the faster streaming extractor.                                              |
| `json.shape`     |                                                                                                  | `'object-row-table' \| 'array-row-table'` | `undefined`  | Selects row-table output for compatibility with existing table extraction workflows.                                                           |
| `json.jsonpaths` | \[![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)]           | `string[]`                                | `[]`         | A list of JSON paths indicating the array that can be streamed.                                                                                |
| `core.metadata`  | \[![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)]           | `boolean`                                 | `false`      | If `true`, yields an initial and final batch containing the partial and final result, i.e. the root object excluding the array being streamed. |

## JSONPaths[​](#jsonpaths "Direct link to JSONPaths")

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](https://loaders.gl/next/docs/modules/tables/json/jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution[​](#attribution "Direct link to Attribution")

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`JSONLoader` supports stateful worker parsing, including self-hosted `json.workerUrl` assets. Atomic documents and batches return as transferable binary JSON frames. The caller decodes these bytes into JSON values; decoded object graphs never enter structured clone. Heterogeneous rows, container metadata, negative zero, and nonfinite numbers produced by parsing retain their semantics. See [JSON worker batches](https://loaders.gl/next/docs/modules/tables/json.md#parsing-batches-in-workers) for cancellation, progress, backpressure, and Node worker options.
