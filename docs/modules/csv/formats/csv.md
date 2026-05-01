import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSV, TSV, DSV

<CsvDocsTabs active="overview" />

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

## Geospatial

CSV is often used for simple geospatial tables. Coordinates may be stored in latitude and longitude columns, or geometry may be encoded in text columns using formats such as WKT or hex-encoded WKB. `CSVLoader` can detect supported geometry columns when `csv.detectGeometryColumns` is enabled.

## History

Delimited text formats predate modern spreadsheet and database software. CSV became a common interchange format through spreadsheet applications and was later documented by [RFC4180](https://tools.ietf.org/html/rfc4180), though real-world CSV files still vary beyond that description.
