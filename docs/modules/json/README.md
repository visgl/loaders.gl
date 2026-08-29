---
title: '@loaders.gl/json'
description: Parse JSON, newline-delimited JSON, and GeoJSON into document, table, or feature data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Structured data module"
  title="Use JSON where it is strongest, then choose a shape."
  description="The JSON module covers arbitrary documents, newline-delimited records, tabular arrays, and GeoJSON. Applications can preserve nested structures or ask for table and feature outputs when that is the better next step."
  tone="yellow"
  meta={['JSON / NDJSON', 'GeoJSON', 'Table and feature output']}
  links={[
    {label: 'JSON category', to: '/docs/specifications/category-json'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

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

The `@loaders.gl/json` module parses JSON, tabular JSON, and geospatial formats that use JSON encoding. It includes:

- `JSONLoader` for arbitrary JSON documents.
- `JSONTableLoader` for JSON documents that should always resolve to table output.
- `GeoJSONLoader` for the GeoJSON geospatial format, which uses JSON encoding.
- Streaming JSON and GeoJSON loaders for line-oriented formats.

The JSON loaders also support batched parsing which can be useful when loading very large tabular JSON files
to avoid blocking for tens of seconds.

<ReferenceBoundary
  title="JSON module details"
  description="The sections below list loaders and writers, output shapes, streaming behavior, and parser options."
  tone="yellow"
/>

`JSONLoader` exposes `json.backend: 'fast'` as an experimental opt-in backend for streaming extraction. This keeps atomic JSON parsing on the standard `JSON.parse` path while using the faster streaming parser for `loadInBatches`.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/json
```

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader) | Loads arbitrary JSON documents and can extract arrays as loaders.gl row tables. |
| [`JSONTableLoader`](/docs/modules/json/api-reference/json-table-loader) | Loads JSON row arrays as loaders.gl row tables or Apache Arrow tables. |
| [`NDJSONLoader`](/docs/modules/json/api-reference/ndjson-loader) | Loads newline-delimited JSON records. |
| [`GeoJSONLoader`](/docs/modules/json/api-reference/geojson-loader) | Loads GeoJSON features and feature collections. |
| [`NDGeoJSONLoader`](/docs/modules/json/api-reference/ndgeojson-loader) | Loads newline-delimited GeoJSON records. |
| [`JSONWriter`](/docs/modules/json/api-reference/json-writer) | Writes loaders.gl tables as JSON arrays or custom wrapped JSON values. |
| [`GeoJSONWriter`](/docs/modules/json/api-reference/geojson-writer) | Writes geospatial tables as GeoJSON. |

## Additional APIs

- See [table category](/docs/specifications/category-table).
- See [GIS category](/docs/specifications/category-gis).

## JSON Format Notes

The classic JSON format was designed for simplicity and is supported by standard libraries in many programming languages.

Several [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia) have emerged, that typically
place one JSON object on each line of a file. These are convenient to use when streaming data and are
supported by via the `NDJSONLoader` and `NDGeoJSONLoader`.

At the moment, auto-detection between streaming and classic JSON based on file contents
is not implemented, so two separate loaders are provided.
The two loaders look for different file extensions or MIME types as specified in the table below,
allowing correct distinctions to be made in usage.

| Format                                            | Extension    | MIME Media Type            | Support                                                       |
| ------------------------------------------------- | ------------ | -------------------------- | ------------------------------------------------------------- | --- |
| [JSON][format_json]                               | `.json`      | `application/json`         | `JSONLoader`                                                  |
| [NewLine Delimited JSON][format_ndjson]           | `.ndjson`    | `application/x-ndjson`     | `NDJSONLoader`                                                |
| [JSON Lines][format_jsonlines]                    | `.jsonl`     | `application/x-ldjson`     | `NDJSONLoader`                                                |
| [JSON Text Sequences][format_json_seq]            |              | `application/json-seq`     | `NDJSONLoader`. Partial records must not span multiple lines. |     |
| [GeoJSON][format_geojson]                         | `.geojson`   | `application/geo+json`     | `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON][format_ndgeojson]     | `.ndgeojson` |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Lines][format_geojson]                   | `.geojsonl`  |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences][format_geojson_text_seq] |              | `application/geo+json-seq` | `NDGeoJSONLoader`                                             |

[format_json]: https://www.json.org/json-en.html
[format_ndjson]: http://ndjson.org/
[format_jsonlines]: http://jsonlines.org/
[format_json_seq]: https://datatracker.ietf.org/doc/html/rfc7464
[format_geojson]: https://geojson.org/
[format_ndgeojson]: https://stevage.github.io/ndgeojson/
[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_geojson_text_seq]: https://datatracker.ietf.org/doc/html/rfc8142
[rfc4288]: https://www.ietf.org/rfc/rfc4288.txt
