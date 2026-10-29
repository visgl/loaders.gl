Structured text format

![](/next/images/format-logos/json-logo.gif)JSON

# JSON

JSON represents nested values in a form that works naturally across browsers, services, and configuration files. loaders.gl also provides line-oriented loaders when records should arrive incrementally.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

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

Choose the right shape

## Parse a document, or process one record at a time.

The same text family supports nested documents and streams of records. Pick the loader whose output and boundaries match the next step in your application.

01

Document

Objects and arrays with nested values

02

Stream

NDJSON or JSONL records arriving incrementally

03

Table

JSONTableLoader for a stable tabular contract

04

Specialize

GeoJSON, glTF, TileJSON, or JSON Schema

[![NDJSON scan supported](https://img.shields.io/badge/Scan-NDJSON_supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

JavaScript Object Notation (JSON) is a text format for structured data. It is commonly used for configuration files, web APIs, tabular records, and nested documents.

Detailed guide

## JSON syntax and loader choices

The sections below cover nested values, tabular and line-oriented variants, scan behavior, encoding, and geospatial JSON.

* *[`@loaders.gl/tables/json`](https://loaders.gl/next/docs/modules/tables/json.md)*
* *[JSON.org](https://www.json.org/json-en.html)*
* *[RFC8259](https://www.rfc-editor.org/rfc/rfc8259)*

## About JSON[​](#about-json "Direct link to About JSON")

JSON stores values as objects, arrays, strings, numbers, booleans, and null. The format is easy for humans to inspect and is natively supported by JavaScript and many other programming languages.

## Tabular Data[​](#tabular-data "Direct link to Tabular Data")

JSON can represent deeply nested structures, not just rectangular tables. `JSONLoader` can parse complete JSON documents and can also stream rows from an array inside a larger document. Use `JSONTableLoader` when the public contract should always return table output.

## Syntax[​](#syntax "Direct link to Syntax")

JSON objects use name/value pairs, arrays use ordered lists, and strings use double quotes. JSON does not allow comments or trailing commas in strict parsers.

## Variants[​](#variants "Direct link to Variants")

Line-oriented variants such as NDJSON, JSON Lines, and JSON text sequences store one JSON record per line or record separator. loaders.gl handles those formats with `NDJSONLoader`.

## Scan support[​](#scan-support "Direct link to Scan support")

The scan badge on this page applies to line-oriented NDJSON/JSONL sources, not arbitrary nested JSON documents. `NDJSONSource` parses one record stream into bounded Arrow batches without a database ingest step.

| Capability                 | NDJSON / JSONL     | General JSON document                   |
| -------------------------- | ------------------ | --------------------------------------- |
| Common entry point         | `read()`           | Not provided                            |
| Schema discovery           | ✅ Supported       | Use the JSON loaders directly           |
| Predicate                  | Residual           | —                                       |
| Projection                 | ✅ Supported       | —                                       |
| Global limit               | ✅ Supported       | —                                       |
| Streaming and cancellation | ✅ Supported       | Depends on the selected JSON loader API |
| Physical pruning           | Linear record scan | —                                       |

## JSON Encoding[​](#json-encoding "Direct link to JSON Encoding")

JSON is used as an encoding or serialization format for many higher level formats, such as GeoJSON, glTF, TileJSON, and JSON Schema.

## Geospatial[​](#geospatial "Direct link to Geospatial")

GeoJSON is a JSON-based geospatial format for features, geometries, and feature collections. loaders.gl provides dedicated `GeoJSONLoader`, `NDGeoJSONLoader`, and `GeoJSONWriter` APIs for geospatial JSON workflows.
