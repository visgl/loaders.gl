---
title: JSON format
description: Load, stream, transform, and write JSON documents and table-shaped JSON data through one set of APIs.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Document and table format"
  title="Start with JSON. Keep the next step open."
  description="The JSON module handles arbitrary documents, row arrays, newline-delimited records, GeoJSON, and JSON output. Choose the result shape that matches the application instead of writing a new parser path for each variant."
  tone="blue"
  meta={['JSON and NDJSON', 'GeoJSON', 'Rows and Arrow tables']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'JSONLoader', to: '/docs/modules/json/api-reference/json-loader'},
    {label: 'Table category', to: '/docs/specifications/category-table'}
  ]}
/>

<JsonDocsTabs active="format" />

<DocOrientation
  eyebrow="Flexible input, explicit output"
  title="Use the document shape you already have."
  description="JSON may be a nested document, a stream of records, or a table-like array. loaders.gl keeps those cases separate while letting applications select object rows, arrays, columns, Arrow, or geometry tables where appropriate."
  tone="blue"
  items={[
    {label: 'Documents', value: 'Load arbitrary nested JSON without imposing a table schema.'},
    {label: 'Records', value: 'Stream NDJSON or row arrays incrementally.'},
    {label: 'Geospatial', value: 'Decode GeoJSON into shared geometry data shapes.'},
    {label: 'Output', value: 'Write JSON values or compatible table representations.'}
  ]}
/>

<ReferenceBoundary
  title="JSON format and API details"
  description="The reference below compares JSON loaders, streaming variants, GeoJSON behavior, output shapes, and writers."
  tone="blue"
/>

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/json/api-reference/json-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>JSONLoader</strong>
    <span>Loads arbitrary JSON documents and can extract arrays as loaders.gl row tables.</span>
    <span className="docs-api-card__meta">Output: JSON value, ObjectRowTable, ArrayRowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/json/api-reference/json-table-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>JSONTableLoader</strong>
    <span>Loads JSON row arrays as loaders.gl row tables or Apache Arrow tables.</span>
    <span className="docs-api-card__meta">Output: ObjectRowTable, ArrayRowTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/json/api-reference/json-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>JSONWriter</strong>
    <span>Writes loaders.gl tables as JSON arrays or custom wrapped JSON values.</span>
    <span className="docs-api-card__meta">Input: Table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeTextSync</span>
  </a>
</div>

| Characteristic | Value                                         |
| -------------- | --------------------------------------------- |
| File Format    | JSON                                          |
| Data Format    | JSON objects, arrays, and [Tables](/docs/specifications/category-table) |
| File Type      | Text                                          |
| File Extension | `.json`                                       |
| MIME Types     | `application/json`                            |

## Streaming Variants

| Format                                            | Extension    | MIME Media Type            | Support                                                       |
| ------------------------------------------------- | ------------ | -------------------------- | ------------------------------------------------------------- |
| [JSON](https://www.json.org/json-en.html)         | `.json`      | `application/json`         | `JSONLoader`                                                  |
| [NewLine Delimited JSON](http://ndjson.org/)      | `.ndjson`    | `application/x-ndjson`     | `NDJSONLoader`                                                |
| [JSON Lines](http://jsonlines.org/)               | `.jsonl`     | `application/x-ldjson`     | `NDJSONLoader`                                                |
| [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464) |              | `application/json-seq`     | `NDJSONLoader`. Partial records must not span multiple lines. |
| [GeoJSON](https://geojson.org/)                   | `.geojson`   | `application/geo+json`     | `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON](https://stevage.github.io/ndgeojson/) | `.ndgeojson` |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Lines](https://www.placemark.io/documentation/geojsonl) | `.geojsonl`  |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc8142) |              | `application/geo+json-seq` | `NDGeoJSONLoader`                                             |
