Table module

CSV

# @loaders.gl/tables/csv

The CSV module handles CSV and TSV input through the same loaders.gl APIs used by binary table formats. It can materialize a table, emit batches as records arrive, or write compatible data back to text.

[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

⛶⛶ Explore fullscreen

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

The CSV path

## Read rows incrementally when the file is large.

CSV is simple to exchange but expensive to hold as one string. The loader can parse records into table batches so applications can process, filter, or display them as they arrive.

01

Input

Comma-, tab-, or delimiter-separated text

02

Output

Rows, columnar tables, or Arrow tables

03

Streaming

Async batches with projection and limits

04

Write

Encode compatible table data as CSV text

The `@loaders.gl/tables/csv` module handles tabular data stored in CSV and TSV format [CSV/DSV file format](https://en.wikipedia.org/wiki/Comma-separated_values).

Detailed guide

## CSV module details

The sections below cover installation, loaders, writers, parsing options, and table output.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| API                                                                                                   | Description                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`CSVLoader`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)       | Loads CSV and TSV data as loaders.gl tables. |
| [`CSVWorkerLoader`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md) | Deprecated alias for `CSVLoader`.            |
| [`CSVWriter`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-writer.md)       | Writes loaders.gl tables as CSV text.        |

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

See the [table category](https://loaders.gl/next/docs/specifications/category-table.md) for output shapes and shared table APIs.

## Attributions[​](#attributions "Direct link to Attributions")

CSVLoader is based on a fork of the [papaparse](https://github.com/mholt/PapaParse) module, under MIT license.
