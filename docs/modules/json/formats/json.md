---
title: JSON format
description: A text format for structured values, documents, APIs, and line-oriented records.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Structured text format"
  title="Start with readable data. Stream it when it grows."
  description="JSON represents nested values in a form that works naturally across browsers, services, and configuration files. loaders.gl also provides line-oriented loaders when records should arrive incrementally."
  tone="cyan"
  meta={['JSON documents', 'NDJSON and JSONL', 'Table output']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'JSONLoader', to: '/docs/modules/json/api-reference/json-loader'}
  ]}
/>

<JsonDocsTabs active="overview" />

<DocOrientation
  eyebrow="Choose the right shape"
  title="Parse a document, or process one record at a time."
  description="The same text family supports nested documents and streams of records. Pick the loader whose output and boundaries match the next step in your application."
  tone="cyan"
  items={[
    {label: 'Document', value: 'Objects and arrays with nested values'},
    {label: 'Stream', value: 'NDJSON or JSONL records arriving incrementally'},
    {label: 'Table', value: 'JSONTableLoader for a stable tabular contract'},
    {label: 'Specialize', value: 'GeoJSON, glTF, TileJSON, or JSON Schema'}
  ]}
/>

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-NDJSON_supported-2f855a.svg?style=flat-square" alt="NDJSON scan supported" />
  </a>
</p>

JavaScript Object Notation (JSON) is a text format for structured data. It is commonly used for configuration files, web APIs, tabular records, and nested documents.

<ReferenceBoundary
  title="JSON syntax and loader choices"
  description="The sections below cover nested values, tabular and line-oriented variants, scan behavior, encoding, and geospatial JSON."
  tone="cyan"
/>

- _[`@loaders.gl/json`](/docs/modules/json)_
- _[JSON.org](https://www.json.org/json-en.html)_
- _[RFC8259](https://www.rfc-editor.org/rfc/rfc8259)_

## About JSON

JSON stores values as objects, arrays, strings, numbers, booleans, and null. The format is easy for humans to inspect and is natively supported by JavaScript and many other programming languages.

## Tabular Data

JSON can represent deeply nested structures, not just rectangular tables. `JSONLoader` can parse complete JSON documents and can also stream rows from an array inside a larger document. Use `JSONTableLoader` when the public contract should always return table output.

## Syntax

JSON objects use name/value pairs, arrays use ordered lists, and strings use double quotes. JSON does not allow comments or trailing commas in strict parsers.

## Variants

Line-oriented variants such as NDJSON, JSON Lines, and JSON text sequences store one JSON record per line or record separator. loaders.gl handles those formats with `NDJSONLoader`.

## Scan support

The scan badge on this page applies to line-oriented NDJSON/JSONL sources, not arbitrary nested JSON
documents. `NDJSONSource` parses one record stream into bounded Arrow batches without a database
ingest step.

| Capability | NDJSON / JSONL | General JSON document |
| --- | --- | --- |
| Common entry point | `read()` | Not provided |
| Schema discovery | Supported | Use the JSON loaders directly |
| Predicate | Residual | — |
| Projection | Supported | — |
| Global limit | Supported | — |
| Streaming and cancellation | Supported | Depends on the selected JSON loader API |
| Physical pruning | Linear record scan | — |

## JSON Encoding

JSON is used as an encoding or serialization format for many higher level formats, such as GeoJSON, glTF, TileJSON, and JSON Schema.

## Geospatial

GeoJSON is a JSON-based geospatial format for features, geometries, and feature collections. loaders.gl provides dedicated `GeoJSONLoader`, `NDGeoJSONLoader`, and `GeoJSONWriter` APIs for geospatial JSON workflows.
