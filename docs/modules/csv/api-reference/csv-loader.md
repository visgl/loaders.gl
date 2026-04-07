# CSVLoader

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [CSV](/docs/modules/csv/formats/csv)                |
| Data Format    | [Tables](/docs/specifications/category-table)       |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`      |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url, CSVLoader);
// or
const data = await load(url, CSVLoader, {csv: options});
```

A complication with the CSV format is that CSV files can come with or without an initial header line. While the `CSVLoader` will attempt to detect if the first line is a header, this can fail. If you know the format of the file you can use `options.csv.header` to specify how to handle the first line.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url_to_csv_with_header, CSVLoader, {csv: {header: true});
const data = await load(url_to_csv_without_header, CSVLoader, {csv: {header: false});
```

## CSVLoader Options

| Option                    | Type                                      | Default                  | Description                                                                                                                  |
| ------------------------- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `csv.shape`               | `'object-row-table' \| 'array-row-table'` | `object-row-table`       | Output rows as objects keyed by column name or as arrays of values.                                                          |
| `csv.optimizeMemoryUsage` | `boolean`                                 | `false`                  | Optimize memory usage at the cost of additional parsing time.                                                                |
| `csv.header`              | `boolean \| 'auto'`                       | `auto`                   | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers. |
| `csv.columnPrefix`        | `string`                                  | `column`                 | Prefix used when generating column names for files without headers (for example, `column1`, `column2`, ...).                 |
| `csv.quoteChar`           | `string`                                  | `"`                      | Character used to quote fields.                                                                                              |
| `csv.escapeChar`          | `string`                                  | `"`                      | Character used to escape the quote character within a field.                                                                 |
| `csv.dynamicTyping`       | `boolean`                                 | `true`                   | Convert numeric and boolean values from strings to their native types.                                                       |
| `csv.comments`            | `boolean`                                 | `false`                  | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`      | `boolean \| 'greedy'`                     | `true`                   | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.delimitersToGuess`   | `string[]`                                | `[',', '\t', '\|', ';']` | Delimiters to try when no delimiter is specified.                                                                            |

## CSVArrowLoader

`CSVArrowLoader` loads CSV and TSV data as Apache Arrow tables.

| Loader         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [CSV](/docs/modules/csv/formats/csv)                |
| Data Format    | [Arrow Tables](/docs/specifications/category-table) |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
| Supported APIs | `load`, `parse`, `parseText`, `parseInBatches`      |

By default, `CSVArrowLoader` emits Arrow `Utf8` columns and does not infer numeric, boolean, or date types. Set `csv.dynamicTyping: true` to opt into typed Arrow columns.

```typescript
import {load} from '@loaders.gl/core';
import {CSVArrowLoader} from '@loaders.gl/csv';

const table = await load(url, CSVArrowLoader);
const typedTable = await load(url, CSVArrowLoader, {csv: {dynamicTyping: true}});
```

For the default `csv.dynamicTyping: false` path, `CSVArrowLoader.parse(ArrayBuffer)` uses a byte-oriented parser for supported CSV options and creates Arrow `Utf8` columns without materializing per-cell JavaScript strings. `CSVArrowLoader.parseText` encodes text to UTF-8 and uses the same byte-oriented path when possible. `CSVArrowLoader.parseInBatches` uses the byte-oriented path when the input can be emitted as one batch, and keeps the streaming string parser for explicit batch sizes.

### CSVArrowLoader Options

`CSVArrowLoader` supports the same CSV parsing options as `CSVLoader`, except `csv.shape` because the output shape is always `arrow-table`.

| Option                  | Type                  | Default                  | Description                                                                                                                  |
| ----------------------- | --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `csv.header`            | `boolean \| 'auto'`   | `auto`                   | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers. |
| `csv.columnPrefix`      | `string`              | `column`                 | Prefix used when generating column names for files without headers (for example, `column1`, `column2`, ...).                 |
| `csv.quoteChar`         | `string`              | `"`                      | Character used to quote fields.                                                                                              |
| `csv.escapeChar`        | `string`              | `"`                      | Character used to escape the quote character within a field.                                                                 |
| `csv.dynamicTyping`     | `boolean`             | `false`                  | If `false`, emit Arrow `Utf8` columns. If `true`, infer typed Arrow columns from parsed values.                              |
| `csv.comments`          | `boolean`             | `false`                  | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`    | `boolean \| 'greedy'` | `true`                   | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.delimitersToGuess` | `string[]`            | `[',', '\t', '\|', ';']` | Delimiters to try when no delimiter is specified.                                                                            |
