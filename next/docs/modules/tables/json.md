Structured data module

![](/next/images/format-logos/json-logo.gif)JSON

# @loaders.gl/tables/json

The JSON module covers arbitrary documents, newline-delimited records, tabular arrays, and GeoJSON. Applications can preserve nested structures or ask for table and feature outputs when that is the better next step.

[JSON category](https://loaders.gl/next/docs/specifications/category-json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-json.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

Structured data boundaries

## Keep the source shape. Choose the application shape.

JSON, delimited text, BSON, and XML describe data differently. loaders.gl keeps those input boundaries explicit while letting applications choose documents, tables, features, or trees for the next stage.

Input families

[**JSON**nested documents↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**NDJSON**one record per line↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[**CSV / TSV**delimited rows↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[**BSON**typed binary documents↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[**XML**namespaced trees↗](https://loaders.gl/next/docs/modules/xml/formats/xml.md)

pars&#x65;**→**

load()

Common API boundary

documentbatchstream

load · parse · write

shap&#x65;**→**

Application results

**Document**nested objects and arrays

**Table**rows, columns, or Arrow batches

**Features**geometry plus properties

**Tree**format-specific document structure

A readable interchange format can stay readable at the edge, or become a typed table when that is what the application needs.

One module, several paths

## Keep documents, rows, and features distinct.

JSON values are not automatically tables. The module keeps the source structure available, while specialized loaders make the intended table or geospatial interpretation explicit.

01

Documents

Nested objects, arrays, and scalar values

02

Rows

JSON arrays and newline-delimited JSON records

03

Features

GeoJSON geometries, features, and collections

04

Batches

Incremental parsing for line-oriented inputs

The `@loaders.gl/tables/json` module parses JSON, tabular JSON, and geospatial formats that use JSON encoding. It includes:

* `JSONLoader` for arbitrary JSON documents.
* `JSONTableLoader` for JSON documents that should always resolve to table output.
* `GeoJSONLoader` for the GeoJSON geospatial format, which uses JSON encoding.
* Streaming JSON and GeoJSON loaders for line-oriented formats.

The JSON loaders also support batched parsing which can be useful when loading very large tabular JSON files to avoid blocking for tens of seconds.

## Parsing batches in workers[​](#parsing-batches-in-workers "Direct link to Parsing batches in workers")

`JSONLoader`, `JSONTableLoader`, and `NDJSONLoader` support incremental worker parsing. Arrow output transfers as owned Arrow column buffers. Arbitrary documents, heterogeneous row output, and container metadata transfer as owned UTF-8 JSON frames and are decoded on the caller. Core enables supported browser workers by default. Set `core.worker: false` to retain caller-side parsing and logging. The following example makes worker selection explicit while consuming results as an async iterator:

```
import {loadInBatches} from '@loaders.gl/core';

import {NDJSONLoader} from '@loaders.gl/tables/json';



const controller = new AbortController();

const batches = await loadInBatches('records.ndjson', NDJSONLoader, {

  core: {worker: true, batchSize: 1024},

  ndjson: {shape: 'arrow-table'},

  signal: controller.signal,

  onProgress: ({phase, completed, unit}) => console.log(phase, completed, unit)

});

for await (const batch of batches) {

  consume(batch.data); // Hydrated Apache Arrow Table for arrow-table output.

}
```

One worker retains parser state across byte chunks, including split UTF-8 sequences. It requests input as needed and waits for the consumer before advancing past an output batch. Completed rows can arrive before EOF; a large incomplete JSON value or input chunk can still require substantial memory. NDJSON keeps one inferred Arrow schema across batches, or uses `ndjson.schema` when supplied. JSONTable uses `json.schema`. Both portable loaders.gl schemas and Apache Arrow `Schema` instances are supported, including schema/field metadata and conversion policies.

JSON supports both `clarinet` and `fast` backends, JSONPath selection, and partial/final container metadata, with the selected backend's existing behavior. The fast backend currently retains container fields before the selected array; use clarinet when trailing container fields are needed. Worker results contain owned Arrow column buffers or binary JSON buffers and small transport descriptors; decoded row arrays and container objects are never structured-cloned across the boundary. The caller hydrates Arrow tables or decodes JSON frames. JSON frames preserve negative zero, nonfinite parser results, and undefined metadata fields, and do not coerce heterogeneous rows into an Arrow schema. Worker progress counts decoded rows within the `decode` phase; it is not a byte or overall download percentage.

Breaking out of the loop closes the input and releases the worker. Aborting also interrupts a blocked input read and rejects with the caller's reason; underlying iterator cleanup is best effort and cannot delay cancellation. Already transferred input buffers remain detached.

Set `core.workerInBatches: false` to retain caller-side batch parsing. Custom worker URLs require `core.workerInBatches: true` to declare protocol support. Browser workers use the published CDN asset by default, so bundling the application does not require copying a worker beside it. To self-host, set `json.workerUrl`, `json-table.workerUrl`, or `ndjson.workerUrl` for the chosen loader. Node workers remain experimental and require `core._nodeWorkers: true`; browser and CommonJS Node worker bundles are included in the package. `GeoJSONLoader`, `NDGeoJSONLoader`, and the experimental `FastJSONLoader` do not opt into this new worker. Use `JSONTableLoader` with `json.backend: 'fast'` for fast-backend Arrow worker batches.

For configuration formats with the same general object/array data model, see the dependency-free [`YAMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/yaml-loader.md) and [`TOMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/toml-loader.md) in `@loaders.gl/config`.

Detailed guide

## JSON module details

The sections below list loaders and writers, output shapes, streaming behavior, and parser options.

`JSONLoader` exposes `json.backend: 'fast'` as an experimental opt-in backend for streaming extraction. This keeps atomic JSON parsing on the standard `JSON.parse` path while using the faster streaming parser for `loadInBatches`.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer                                                                                               | Description                                                                     |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)            | Loads arbitrary JSON documents and can extract arrays as loaders.gl row tables. |
| [`JSONTableLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md) | Loads JSON row arrays as loaders.gl row tables or Apache Arrow tables.          |
| [`NDJSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)        | Loads newline-delimited JSON records.                                           |
| [`GeoJSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)      | Loads GeoJSON features and feature collections.                                 |
| [`NDGeoJSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)  | Loads newline-delimited GeoJSON records.                                        |
| [`JSONWriter`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)            | Writes loaders.gl tables as JSON arrays or custom wrapped JSON values.          |
| [`GeoJSONWriter`](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)      | Writes geospatial tables as GeoJSON.                                            |

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

* See [table category](https://loaders.gl/next/docs/specifications/category-table.md).
* See [GIS category](https://loaders.gl/next/docs/specifications/category-gis.md).

## JSON Format Notes[​](#json-format-notes "Direct link to JSON Format Notes")

The classic JSON format was designed for simplicity and is supported by standard libraries in many programming languages.

Several [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia) have emerged, that typically place one JSON object on each line of a file. These are convenient to use when streaming data and are supported via the `NDJSONLoader` and `NDGeoJSONLoader`.

At the moment, auto-detection between streaming and classic JSON based on file contents is not implemented, so two separate loaders are provided. The two loaders look for different file extensions or MIME types as specified in the table below, allowing correct distinctions to be made in usage.

| Format                                                                  | Extension    | MIME Media Type            | Support                                                          |
| ----------------------------------------------------------------------- | ------------ | -------------------------- | ---------------------------------------------------------------- |
| [JSON](https://www.json.org/json-en.html)                               | `.json`      | `application/json`         | ✅ `JSONLoader`                                                  |
| [NewLine Delimited JSON](http://ndjson.org/)                            | `.ndjson`    | `application/x-ndjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Lines](http://jsonlines.org/)                                     | `.jsonl`     | `application/x-ldjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464)    |              | `application/json-seq`     | ⚠️ `NDJSONLoader`. Partial records must not span multiple lines. |
| [GeoJSON](https://geojson.org/)                                         | `.geojson`   | `application/geo+json`     | ✅ `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON](https://stevage.github.io/ndgeojson/)       | `.ndgeojson` |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Lines](https://geojson.org/)                                   | `.geojsonl`  |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc8142) |              | `application/geo+json-seq` | ⚠️ `NDGeoJSONLoader`. Each Feature must fit on one line.         |
