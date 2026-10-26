---
title: '@loaders.gl/tables/json'
description: Parse JSON, newline-delimited JSON, and GeoJSON into document, table, or feature data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StructuredDataPathGraphic} from '@site/src/components/docs/structured-data-path-graphic';

<DocPageHeader
  format="json"
  eyebrow="Structured data module"
  title="@loaders.gl/tables/json"
  description="The JSON module covers arbitrary documents, newline-delimited records, tabular arrays, and GeoJSON. Applications can preserve nested structures or ask for table and feature outputs when that is the better next step."
  tone="yellow"
  meta={['JSON / NDJSON', 'GeoJSON', 'Table and feature output']}
  links={[
    {label: 'JSON category', to: '/docs/specifications/category-json'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<StructuredDataPathGraphic />

<DocOrientation
  eyebrow="One module, several paths"
  title="Keep documents, rows, and features distinct."
  description="JSON values are not automatically tables. The module keeps the source structure available, while specialized loaders make the intended table or geospatial interpretation explicit."
  tone="yellow"
  items={[
    {label: 'Documents', value: 'Nested objects, arrays, and scalar values'},
    {label: 'Rows', value: 'JSON arrays and newline-delimited JSON records'},
    {label: 'Features', value: 'GeoJSON geometries, features, and collections'},
    {label: 'Batches', value: 'Incremental parsing for line-oriented inputs'}
  ]}
/>

The `@loaders.gl/tables/json` module parses JSON, tabular JSON, and geospatial formats that use JSON encoding. It includes:

- `JSONLoader` for arbitrary JSON documents.
- `JSONTableLoader` for JSON documents that should always resolve to table output.
- `GeoJSONLoader` for the GeoJSON geospatial format, which uses JSON encoding.
- Streaming JSON and GeoJSON loaders for line-oriented formats.

The JSON loaders also support batched parsing which can be useful when loading very large tabular JSON files
to avoid blocking for tens of seconds.

## Parsing batches in workers

`JSONTableLoader` and `NDJSONLoader` support incremental worker parsing for `arrow-table` output.
`JSONLoader`, row-table requests, and requests for container metadata stay on the caller so
heterogeneous JSON values retain their existing semantics without structured-cloning decoded objects.
Core enables supported browser workers by default. Set `core.worker: false` to retain caller-side
parsing and logging. The following example makes worker selection explicit while consuming results
as an async iterator:

```typescript
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

One worker retains parser state across byte chunks, including split UTF-8 sequences. It requests
input as needed and waits for the consumer before advancing past an output batch. Completed rows
can arrive before EOF; a large incomplete JSON value or input chunk can still require substantial
memory. NDJSON keeps one inferred Arrow schema across batches, or uses `ndjson.schema` when supplied.
JSONTable uses `json.schema`. Both portable loaders.gl schemas and Apache Arrow `Schema` instances
are supported, including schema/field metadata and conversion policies.

JSON supports both `clarinet` and `fast` backends, JSONPath selection, and partial/final container
metadata, with the selected backend's existing behavior. The fast backend currently retains
container fields before the selected array; use clarinet when trailing container fields are needed.
Worker results contain owned Arrow IPC buffers and small table/protocol descriptors; decoded
row arrays and container objects never cross the worker boundary. Arrow tables are hydrated on the caller. Worker progress counts decoded rows within the `decode` phase; it is not a byte or
overall download percentage.

Breaking out of the loop closes the input and releases the worker. Aborting also interrupts a
blocked input read and rejects with the caller's reason; underlying iterator cleanup is best effort
and cannot delay cancellation. Already transferred input buffers remain detached.

Set `core.workerInBatches: false` to retain caller-side batch parsing. Custom worker URLs require
`core.workerInBatches: true` to declare protocol support. Browser workers use the published CDN
asset by default, so bundling the application does not require copying a worker beside it. To
self-host, set `json-table.workerUrl` or `ndjson.workerUrl` for the chosen loader.
Node workers remain experimental and require
`core._nodeWorkers: true`; browser and CommonJS Node worker bundles are included in the package.
`GeoJSONLoader`, `NDGeoJSONLoader`, and the experimental `FastJSONLoader` do not opt into this new
worker. Use `JSONTableLoader` with `json.backend: 'fast'` for fast-backend Arrow worker batches.

For configuration formats with the same general object/array data model, see the dependency-free
[`YAMLLoader`](/docs/modules/config/api-reference/yaml-loader) and
[`TOMLLoader`](/docs/modules/config/api-reference/toml-loader) in `@loaders.gl/config`.

<ReferenceBoundary
  title="JSON module details"
  description="The sections below list loaders and writers, output shapes, streaming behavior, and parser options."
  tone="yellow"
/>

`JSONLoader` exposes `json.backend: 'fast'` as an experimental opt-in backend for streaming extraction. This keeps atomic JSON parsing on the standard `JSON.parse` path while using the faster streaming parser for `loadInBatches`.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/tables
```

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`JSONLoader`](/docs/modules/tables/json/api-reference/json-loader) | Loads arbitrary JSON documents and can extract arrays as loaders.gl row tables. |
| [`JSONTableLoader`](/docs/modules/tables/json/api-reference/json-table-loader) | Loads JSON row arrays as loaders.gl row tables or Apache Arrow tables. |
| [`NDJSONLoader`](/docs/modules/tables/json/api-reference/ndjson-loader) | Loads newline-delimited JSON records. |
| [`GeoJSONLoader`](/docs/modules/tables/json/api-reference/geojson-loader) | Loads GeoJSON features and feature collections. |
| [`NDGeoJSONLoader`](/docs/modules/tables/json/api-reference/ndgeojson-loader) | Loads newline-delimited GeoJSON records. |
| [`JSONWriter`](/docs/modules/tables/json/api-reference/json-writer) | Writes loaders.gl tables as JSON arrays or custom wrapped JSON values. |
| [`GeoJSONWriter`](/docs/modules/tables/json/api-reference/geojson-writer) | Writes geospatial tables as GeoJSON. |

## Additional APIs

- See [table category](/docs/specifications/category-table).
- See [GIS category](/docs/specifications/category-gis).

## JSON Format Notes

The classic JSON format was designed for simplicity and is supported by standard libraries in many programming languages.

Several [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia) have emerged, that typically
place one JSON object on each line of a file. These are convenient to use when streaming data and are
supported via the `NDJSONLoader` and `NDGeoJSONLoader`.

At the moment, auto-detection between streaming and classic JSON based on file contents
is not implemented, so two separate loaders are provided.
The two loaders look for different file extensions or MIME types as specified in the table below,
allowing correct distinctions to be made in usage.

| Format                                            | Extension    | MIME Media Type            | Support                                                       |
| ------------------------------------------------- | ------------ | -------------------------- | ------------------------------------------------------------- |
| [JSON][format_json]                               | `.json`      | `application/json`         | ✅ `JSONLoader`                                                  |
| [NewLine Delimited JSON][format_ndjson]           | `.ndjson`    | `application/x-ndjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Lines][format_jsonlines]                    | `.jsonl`     | `application/x-ldjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Text Sequences][format_json_seq]            |              | `application/json-seq`     | ⚠️ `NDJSONLoader`. Partial records must not span multiple lines. |
| [GeoJSON][format_geojson]                         | `.geojson`   | `application/geo+json`     | ✅ `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON][format_ndgeojson]     | `.ndgeojson` |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Lines][format_geojson]                   | `.geojsonl`  |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences][format_geojson_text_seq] |              | `application/geo+json-seq` | ⚠️ `NDGeoJSONLoader`. Each Feature must fit on one line.                                             |

[format_json]: https://www.json.org/json-en.html
[format_ndjson]: http://ndjson.org/
[format_jsonlines]: http://jsonlines.org/
[format_json_seq]: https://datatracker.ietf.org/doc/html/rfc7464
[format_geojson]: https://geojson.org/
[format_ndgeojson]: https://stevage.github.io/ndgeojson/
[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_geojson_text_seq]: https://datatracker.ietf.org/doc/html/rfc8142
[rfc4288]: https://www.ietf.org/rfc/rfc4288.txt
