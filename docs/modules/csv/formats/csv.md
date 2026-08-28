import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSV, TSV, DSV

<CsvDocsTabs active="overview" />

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

Comma-separated values, and more generally delimiter-separated values, is a common text encoding for tabular data.

- _[`@loaders.gl/csv`](/docs/modules/csv)_
- _[RFC4180](https://tools.ietf.org/html/rfc4180)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/Delimiter-separated_values)_

## About CSV, TSV, DSV

Comma-separated values, and more generally, delimiter-separated values is a common file encoding.

CSV stores tables as plain text. Each record is usually one line, and each field is separated by a delimiter. CSV is widely used because it is easy to inspect, stream, generate, and exchange between spreadsheets, databases, command line tools, and web applications.

## Syntax

The common CSV syntax uses commas between fields and line breaks between records. Fields can be quoted with double quotes when they contain delimiters, line breaks, or quote characters. Quote characters inside quoted fields are escaped by doubling them.

## Variants

CSV files often vary in delimiter, quoting, header rows, empty-line handling, comments, character encoding, and type conventions. TSV uses tabs as delimiters, and DSV is the general name for delimiter-separated values with other separators such as semicolons or pipes.

## Scan support

`CSVSource` provides a lightweight sequential scan. It does not ingest the file into a database:
records are parsed in source order and emitted as bounded Arrow batches.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `read()` | Streaming Arrow batches |
| Schema discovery | Supported | Columns are discovered from the CSV source |
| Predicate | Supported | Residual, after record parsing |
| Projection | Supported | Applied while producing result batches |
| Limit | Supported | One global limit after filtering |
| Cancellation | Supported | Stops parsing and batch production |
| Random access or byte-range pruning | Not supported | The current adapter is a linear scan |

For a large CSV, projection reduces the result width and a limit can stop the scan early. A
predicate is correct but does not avoid parsing preceding records.

## Geospatial

CSV is often used for simple geospatial tables. Coordinates may be stored in latitude and longitude columns, or geometry may be encoded in text columns using formats such as WKT or hex-encoded WKB. `CSVLoader` can detect supported geometry columns when `csv.detectGeometryColumns` is enabled.

## History

Delimited text formats predate modern spreadsheet and database software. CSV became a common interchange format through spreadsheet applications and was later documented by [RFC4180](https://tools.ietf.org/html/rfc4180), though real-world CSV files still vary beyond that description.
