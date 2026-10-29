Delimited text formats

CSV

# CSV, TSV, and DSV

CSV, TSV, and DSV use plain text to represent rows and fields. Their simplicity makes them useful for exchange, command-line tools, spreadsheets, and streaming pipelines.

[CSV module](https://loaders.gl/next/docs/modules/tables/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

⛶⛶ Explore fullscreen

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

The delimiter is the detail

## Keep the rows readable. Configure the variations.

The same loader handles commas, tabs, semicolons, quotes, headers, and other dialect choices while exposing the result through ordinary table and scan APIs.

01

Layout

One record per line, fields by delimiter

02

Variants

CSV, TSV, and other DSV dialects

03

Input

Files, responses, and streams

04

Output

Objects, tables, or Arrow batches

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

Comma-separated values, and more generally delimiter-separated values, is a common text encoding for tabular data.

* *[`@loaders.gl/tables/csv`](https://loaders.gl/next/docs/modules/tables/csv.md)*
* *[RFC4180](https://tools.ietf.org/html/rfc4180)*
* *[Wikipedia article](https://en.wikipedia.org/wiki/Delimiter-separated_values)*

Detailed guide

## Syntax and scan behavior

The sections below cover delimiters, quoting, variants, and the sequential scan behavior of CSVSource.

## About CSV, TSV, DSV[​](#about-csv-tsv-dsv "Direct link to About CSV, TSV, DSV")

Comma-separated values, and more generally, delimiter-separated values is a common file encoding.

CSV stores tables as plain text. Each record is usually one line, and each field is separated by a delimiter. CSV is widely used because it is easy to inspect, stream, generate, and exchange between spreadsheets, databases, command line tools, and web applications.

## Syntax[​](#syntax "Direct link to Syntax")

The common CSV syntax uses commas between fields and line breaks between records. Fields can be quoted with double quotes when they contain delimiters, line breaks, or quote characters. Quote characters inside quoted fields are escaped by doubling them.

## Variants[​](#variants "Direct link to Variants")

CSV files often vary in delimiter, quoting, header rows, empty-line handling, comments, character encoding, and type conventions. TSV uses tabs as delimiters, and DSV is the general name for delimiter-separated values with other separators such as semicolons or pipes.

## Scan support[​](#scan-support "Direct link to Scan support")

`CSVSource` provides a lightweight sequential scan. It does not ingest the file into a database: records are parsed in source order and emitted as bounded Arrow batches.

| Capability                          | Support          | Execution                                  |
| ----------------------------------- | ---------------- | ------------------------------------------ |
| Entry point                         | ✅ `read()`      | Streaming Arrow batches                    |
| Schema discovery                    | ✅ Supported     | Columns are discovered from the CSV source |
| Predicate                           | ✅ Supported     | Residual, after record parsing             |
| Projection                          | ✅ Supported     | Applied while producing result batches     |
| Limit                               | ✅ Supported     | One global limit after filtering           |
| Cancellation                        | ✅ Supported     | Stops parsing and batch production         |
| Random access or byte-range pruning | ❌ Not supported | The current adapter is a linear scan       |

For a large CSV, projection reduces the result width and a limit can stop the scan early. A predicate is correct but does not avoid parsing preceding records.

## Geospatial[​](#geospatial "Direct link to Geospatial")

CSV is often used for simple geospatial tables. Coordinates may be stored in latitude and longitude columns, or geometry may be encoded in text columns using formats such as WKT or hex-encoded WKB. `CSVLoader` can detect supported geometry columns when `csv.detectGeometryColumns` is enabled.

## History[​](#history "Direct link to History")

Delimited text formats predate modern spreadsheet and database software. CSV became a common interchange format through spreadsheet applications and was later documented by [RFC4180](https://tools.ietf.org/html/rfc4180), though real-world CSV files still vary beyond that description.
