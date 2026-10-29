Delimited text format

CSV

# CSV, TSV, and DSV

CSV, TSV, and related delimiter-separated files are simple to transport but varied in headers, quoting, types, and line endings. The CSV module makes those choices explicit and returns the same table shapes used by other loaders.

[CSV module](https://loaders.gl/next/docs/modules/tables/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv.md)[CSVLoader](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[Using streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

CSV[Try It](https://loaders.gl/next/examples/geospatial/csv)[Overview](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[Format](https://loaders.gl/next/docs/modules/tables/csv/format.md)[CSVLoader](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[CSVWriter](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/tables/csv/benchmarks.md)

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

Delimited data path

## Parse as records, batches, or columns.

The parser handles text incrementally and can expose the result in the form that the next operation needs. This is useful for ordinary application logic as well as large imports and browser-side analysis.

01

Read

Handle delimiters, quoting, headers, and line endings.

02

Batch

Process records as they arrive with parseInBatches().

03

Shape

Return row, columnar, or Arrow-compatible tables.

04

Write

Emit delimited text with controlled columns and options.

Detailed guide

## CSV format and API details

The reference below covers dialect options, type inference, streaming, table output, and writer behavior.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**CSVLoader**Loads CSV and TSV data as loaders.gl row, columnar, or Arrow tables.Output: ObjectRowTable, ArrayRowTable, ColumnarTable, ArrowTableAPIs: load, parse, parseText, parseInBatches](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader)[Writer**CSVWriter**Writes loaders.gl row, columnar, or Arrow tables as comma-separated or delimiter-separated text.Input: Table, ArrowTableAPIs: encode, encodeTextSync](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-writer)

| Characteristic | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| File Format    | CSV, TSV, DSV                                                                |
| Data Format    | [Tables](https://loaders.gl/next/docs/specifications/category-table.md) |
| File Type      | Text                                                                         |
| File Extension | `.csv`, `.tsv`, `.dsv`                                                       |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv`                          |
