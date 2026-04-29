import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSVLoader

<CsvDocsTabs active="csvloader" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

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
| `csv.comments`              | `boolean`                                                                                  | `false`                       | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`        | `boolean \| 'greedy'`                                                                      | `true`                        | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.detectGeometryColumns` | `boolean`                                                                                  | `false`                       | Detect geometry columns when producing geospatial table output.                                                              |
| `csv.delimitersToGuess`     | `string[]`                                                                                 | `[',', '\t', '\|', ';']`      | Delimiters to try when no delimiter is specified.                                                                            |

## Remarks

`CSVWorkerLoader` is a deprecated alias for `CSVLoader`.
