import BrowserOnly from '@docusaurus/BrowserOnly';

# CSV Loaders

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader      | Output                                                        | Use when                      |
| ----------- | ------------------------------------------------------------- | ----------------------------- |
| `CSVLoader` | `ObjectRowTable \| ArrayRowTable \| ArrowTable`               | You want row or columnar data. |

| Characteristic | Value                                               |
| -------------- | --------------------------------------------------- |
| File Format    | [CSV](/docs/modules/csv/formats/csv)                |
| Data Format    | [Tables](/docs/specifications/category-table)       |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
| Supported APIs | `load`, `parse`, `parseText`, `parseInBatches`      |

## CSVLoader

`CSVLoader` loads CSV and TSV data as loaders.gl row tables by default. Set `csv.shape: 'arrow-table'` to request Apache Arrow output.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url, CSVLoader);
// or
const data = await load(url, CSVLoader, {csv: options});
```

Applications that want to defer loading the parser implementation can import the metadata-only loader from the `unbundled` subpath. Core async APIs call `preload()` and dynamically import the parser-bearing implementation when parsing starts.

See [Using Unbundled Loaders](/docs/developer-guide/using-unbundled-loaders) for the bundle-splitting model and preload behavior.

```typescript
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const data = await parse(csvText, CSVLoader);
```

A complication with the CSV format is that CSV files can come with or without an initial header line. While the `CSVLoader` will attempt to detect if the first line is a header, this can fail. If you know the format of the file you can use `options.csv.header` to specify how to handle the first line.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url_to_csv_with_header, CSVLoader, {csv: {header: true}});
const data = await load(url_to_csv_without_header, CSVLoader, {csv: {header: false}});
```

### Unbundled Import

For applications that want the parser implementation loaded on demand, import the metadata-only loader from the `unbundled` subpath. Async core APIs will preload the parser implementation automatically.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const data = await load(url, CSVLoader);
```

## CSVLoader Options

| Option                    | Type                                      | Default                  | Description                                                                                                                  |
| ------------------------- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `csv.shape`               | [![Website shields.io](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)](http://shields.io) `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `object-row-table`       | Output rows as objects, arrays of values, or Apache Arrow columns.                                                          |
| `csv.optimizeMemoryUsage` | `boolean`                                 | `false`                  | Optimize memory usage at the cost of additional parsing time.                                                                |
| `csv.header`              | `boolean \| 'auto'`                       | `auto`                   | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers. |
| `csv.columnPrefix`        | `string`                                  | `column`                 | Prefix used when generating column names for files without headers (for example, `column1`, `column2`, ...).                 |
| `csv.quoteChar`           | `string`                                  | `"`                      | Character used to quote fields.                                                                                              |
| `csv.escapeChar`          | `string`                                  | `"`                      | Character used to escape the quote character within a field.                                                                 |
| `csv.dynamicTyping`       | `boolean`                                 | `true`                   | Convert numeric and boolean values from strings to their native types.                                                       |
| `csv.comments`            | `boolean`                                 | `false`                  | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`      | `boolean \| 'greedy'`                     | `true`                   | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.delimitersToGuess`   | `string[]`                                | `[',', '\t', '\|', ';']` | Delimiters to try when no delimiter is specified.                                                                            |

When `csv.shape: 'arrow-table'` is selected, `CSVLoader` returns loaders.gl `ArrowTable` objects that wrap Apache Arrow tables.

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

## Live Benchmarks

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const BenchmarksApp = require('@site/src/examples/benchmarks-app').default;
    return <BenchmarksApp />;
  }}
</BrowserOnly>
