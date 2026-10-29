Document and table format

![](/next/images/format-logos/json-logo.gif)JSON

# JSON

The JSON module handles arbitrary documents, row arrays, newline-delimited records, GeoJSON, and JSON output. Choose the result shape that matches the application instead of writing a new parser path for each variant.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

Flexible input, explicit output

## Use the document shape you already have.

JSON may be a nested document, a stream of records, or a table-like array. loaders.gl keeps those cases separate while letting applications select object rows, arrays, columns, Arrow, or geometry tables where appropriate.

01

Documents

Load arbitrary nested JSON without imposing a table schema.

02

Records

Stream NDJSON or row arrays incrementally.

03

Geospatial

Decode GeoJSON into shared geometry data shapes.

04

Output

Write JSON values or compatible table representations.

Detailed guide

## JSON format and API details

The reference below compares JSON loaders, streaming variants, GeoJSON behavior, output shapes, and writers.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**JSONLoader**Loads arbitrary JSON documents and can extract arrays as loaders.gl row tables.Output: JSON value, ObjectRowTable, ArrayRowTableAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader)[Loader**JSONTableLoader**Loads JSON row arrays as loaders.gl row tables or Apache Arrow tables.Output: ObjectRowTable, ArrayRowTable, ArrowTableAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader)[Writer**JSONWriter**Writes loaders.gl tables as JSON arrays or custom wrapped JSON values.Input: TableAPIs: encode, encodeTextSync](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer)

| Characteristic | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| File Format    | JSON                                                                                                   |
| Data Format    | JSON objects, arrays, and [Tables](https://loaders.gl/next/docs/specifications/category-table.md) |
| File Type      | Text                                                                                                   |
| File Extension | `.json`                                                                                                |
| MIME Types     | `application/json`                                                                                     |

## Streaming Variants[​](#streaming-variants "Direct link to Streaming Variants")

| Format                                                                  | Extension    | MIME Media Type            | Support                                                          |
| ----------------------------------------------------------------------- | ------------ | -------------------------- | ---------------------------------------------------------------- |
| [JSON](https://www.json.org/json-en.html)                               | `.json`      | `application/json`         | ✅ `JSONLoader`                                                  |
| [NewLine Delimited JSON](http://ndjson.org/)                            | `.ndjson`    | `application/x-ndjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Lines](http://jsonlines.org/)                                     | `.jsonl`     | `application/x-ldjson`     | ✅ `NDJSONLoader`                                                |
| [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464)    |              | `application/json-seq`     | ⚠️ `NDJSONLoader`. Partial records must not span multiple lines. |
| [GeoJSON](https://geojson.org/)                                         | `.geojson`   | `application/geo+json`     | ✅ `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON](https://stevage.github.io/ndgeojson/)       | `.ndgeojson` |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Lines](https://www.placemark.io/documentation/geojsonl)        | `.geojsonl`  |                            | ✅ `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc8142) |              | `application/geo+json-seq` | ⚠️ `NDGeoJSONLoader`. Each Feature must fit on one line.         |
