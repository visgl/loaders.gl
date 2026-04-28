import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';

# JSON

<JsonDocsTabs active="overview" />

JavaScript Object Notation (JSON) is a text format for structured data. It is commonly used for configuration files, web APIs, tabular records, and nested documents.

- _[`@loaders.gl/json`](/docs/modules/json)_
- _[JSON.org](https://www.json.org/json-en.html)_
- _[RFC8259](https://www.rfc-editor.org/rfc/rfc8259)_

## About JSON

JSON stores values as objects, arrays, strings, numbers, booleans, and null. The format is easy for humans to inspect and is natively supported by JavaScript and many other programming languages.

## Tabular Data

JSON can represent deeply nested structures, not just rectangular tables. `JSONLoader` can parse complete JSON documents and can also stream rows from an array inside a larger document.

## Syntax

JSON objects use name/value pairs, arrays use ordered lists, and strings use double quotes. JSON does not allow comments or trailing commas in strict parsers.

## Variants

Line-oriented variants such as NDJSON, JSON Lines, and JSON text sequences store one JSON record per line or record separator. loaders.gl handles those formats with `NDJSONLoader`.

## JSON Encoding

JSON is used as an encoding or serialization format for many higher level formats, such as GeoJSON, glTF, TileJSON, and JSON Schema.

## Geospatial

GeoJSON is a JSON-based geospatial format for features, geometries, and feature collections. loaders.gl provides dedicated `GeoJSONLoader`, `NDGeoJSONLoader`, and `GeoJSONWriter` APIs for geospatial JSON workflows.
