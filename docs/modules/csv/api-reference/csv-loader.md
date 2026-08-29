---
title: CSVLoader
description: Load CSV and TSV data into row, columnar, or Arrow table shapes.
hide_title: true
page_style: designed
---

import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="CSV module · loader API"
  title="CSVLoader"
  description="Load CSV and TSV text into a table shape that suits the next stage of your application, from familiar JavaScript rows to typed Apache Arrow columns."
  tone="blue"
  meta={['From v1.0', 'CSV / TSV', 'Arrow output']}
  links={[
    {label: 'CSV format', to: '/docs/modules/csv/formats/csv'},
    {label: 'CSV module', to: '/docs/modules/csv'}
  ]}
/>

<CsvDocsTabs active="csvloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Start with rows. Move to columns when the pipeline grows."
  description="CSVLoader keeps the simple path simple, then offers columnar and Arrow representations for typed data, geometry columns, and more efficient handoffs."
  tone="blue"
  items={[
    {label: 'Object rows', value: 'Readable records for application code'},
    {label: 'Columnar', value: 'Columns without row-object overhead'},
    {label: 'Arrow', value: 'Typed, binary-compatible table data'},
    {label: 'Geometry', value: 'Optional WKT and WKB detection'}
  ]}
/>

<ReferenceBoundary
  title="CSVLoader reference"
  description="The sections below cover usage, bundle boundaries, headers, typing, geometry columns, and all loader options."
  tone="blue"
/>

`CSVLoader` loads CSV and TSV data as loaders.gl row tables by default. Set `csv.shape: 'array-row-table'`, `csv.shape: 'columnar-table'`, or `csv.shape: 'arrow-table'` to request a different table shape.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url, CSVLoader);
const table = await load(url, CSVLoader, {csv: {shape: 'arrow-table'}});
```

The root CSV export is metadata-only and works with async core APIs such as `load`, `parse`, and `parseInBatches`, which preload the parser implementation when needed. Applications that need a parser-bearing loader object directly can import the same named loader from `@loaders.gl/csv/bundled`:

```typescript
import {CSVLoader} from '@loaders.gl/csv/bundled';
```

Applications that want an explicit metadata-only import can use the `unbundled` subpath. Core async APIs call `preload()` and dynamically import the parser-bearing implementation when parsing starts.

See [Using Unbundled Loaders](/docs/developer-guide/using-unbundled-loaders) for the bundle-splitting model and preload behavior.

```typescript
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const data = await parse(csvText, CSVLoader);
```

### Header Detection

A complication with the CSV format is that CSV files can come with or without an initial header line. While `CSVLoader` attempts to detect if the first line is a header, this can fail. If you know the file shape, use `options.csv.header` to specify how to handle the first line.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(urlToCSVWithHeader, CSVLoader, {csv: {header: true}});
const rows = await load(urlToCSVWithoutHeader, CSVLoader, {csv: {header: false}});
```

### Apache Arrow

When `csv.shape: 'arrow-table'` is selected, `CSVLoader` returns a loaders.gl `ArrowTable` object that wraps an Apache Arrow table.

### Type Inference

By default, `CSVLoader` emits Arrow `Utf8` columns in `csv.shape: 'arrow-table'` mode and does not infer numeric, boolean, or date types. Set `csv.dynamicTyping: true` to opt into typed Arrow columns.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const table = await load(url, CSVLoader, {csv: {shape: 'arrow-table'}});
const typedTable = await load(url, CSVLoader, {
  csv: {shape: 'arrow-table', dynamicTyping: true}
});
```

For the default `csv.dynamicTyping: false` Arrow path, `CSVLoader.parse(ArrayBuffer)` uses a byte-oriented parser for supported CSV options and creates Arrow `Utf8` columns without materializing per-cell JavaScript strings. `CSVLoader.parseText` encodes text to UTF-8 and uses the same byte-oriented path when possible. `CSVLoader.parseInBatches` uses the byte-oriented path when the input can be emitted as one batch, and keeps the streaming string parser for explicit batch sizes.

Set `csv.viewTypes: 'prefer'` to emit `Utf8View` columns when the installed `apache-arrow` runtime supports them, while falling back to `Utf8` with older runtimes. Use `'require'` to throw instead of falling back. The default `'never'` preserves compatibility with Arrow 17 and consumers that do not support view types.

### Geometry Columns

`CSVLoader` can detect WKT and hex-encoded WKB geometry columns when `csv.detectGeometryColumns` is enabled. Detected geometries are emitted as `geoarrow.wkb` by default. Set `csv.geometryEncoding: 'source'` to preserve WKT columns as `geoarrow.wkt`.

## CSVLoader Options

| Option                      | Type                                                                                       | Default                       | Description                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `csv.shape`                 | `'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table'`             | `object-row-table`            | Output rows as objects, arrays of values, columns, or Apache Arrow columns.                                                  |
| `csv.optimizeMemoryUsage`   | `boolean`                                                                                  | `false`                       | Optimize memory usage at the cost of additional parsing time.                                                                |
| `csv.header`                | `boolean \| 'auto'`                                                                        | `auto`                        | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers. |
| `csv.columnPrefix`          | `string`                                                                                   | `column`                      | Prefix used when generating column names for files without headers, for example `column1`, `column2`, ...                    |
| `csv.quoteChar`             | `string`                                                                                   | `"`                           | Character used to quote fields.                                                                                              |
| `csv.escapeChar`            | `string`                                                                                   | `"`                           | Character used to escape the quote character within a field.                                                                 |
| `csv.dynamicTyping`         | `boolean`                                                                                  | `true`                        | Convert numeric and boolean values from strings to their native types.                                                       |
| `csv.viewTypes`             | `'never' \| 'prefer' \| 'require'`                                                        | `'never'`                     | Controls whether Arrow output uses supported `Utf8View` columns.                                                             |
| `csv.comments`              | `boolean`                                                                                  | `false`                       | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`        | `boolean \| 'greedy'`                                                                      | `true`                        | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.detectGeometryColumns` | `boolean`                                                                                  | `false`                       | Detect geometry columns when producing geospatial table output.                                                              |
| `csv.geometryEncoding`      | `'wkb' \| 'source'`                                                                        | `wkb`                         | Output encoding for detected geometry columns. `wkb` normalizes WKT and WKB to `geoarrow.wkb`; `source` preserves WKT.       |
| `csv.delimitersToGuess`     | `string[]`                                                                                 | `[',', '\t', '\|', ';']`      | Delimiters to try when no delimiter is specified.                                                                            |

## Remarks

`CSVWorkerLoader` is a deprecated alias for `CSVLoader`.
