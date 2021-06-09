# CSVLoader

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.csv`, `.dsv`                                       |
| File Type      | Text                                                 |
| File Format    | [RFC4180](https://tools.ietf.org/html/rfc4180)       |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {CSVLoader} from '@loaders.gl/csv';
import {load} from '@loaders.gl/core';

const data = await load(url, CSVLoader);
// or
const data = await load(url, CSVLoader, {csv: options});
```

## Options

| Option                  | Type              | Default        | Description                                                                                                                                                                                                                                                                                     |
| ----------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `csv.header`            | Boolean \| String | `auto`         | If `true`, the first row of parsed data will be interpreted as field names. If `false`, the first row is interpreted as data.                                                                                                                                                                   |
| `csv.rowFormat`         | String            | `object`       | Can be set to `'object'` to force rows to be objects, or `'array'` to return the result data as an array of row values.                                                                                                                                                                         |
| `csv.columnPrefix`      | String            | `column`       | The prefix to use when naming columns for CSV files with no header. Defaults to 'column1', 'column2' etc.                                                                                                                                                                                       |
| `csv.delimiter`         | String            | auto-detect    | The delimiting character.                                                                                                                                                                                                                                                                       |
| `csv.newline`           | String            | auto-detect    | The newline sequence. Must be `\r`, `\n`, or `\r\n`.                                                                                                                                                                                                                                            |
| `csv.quoteChar`         | String            | `"`            | The character used to quote fields.                                                                                                                                                                                                                                                             |
| `csv.escapeChar`        | String            | `"`            | The character used to escape the quote character within a field.                                                                                                                                                                                                                                |
| `csv.dynamicTyping`     | Boolean           | `true`         | If `true`, numeric and boolean data values will be converted to their type (instead if strings. **Note**: if you disable `dynamicTyping`, you need to explicitly set `header` to a boolean value. Otherwise, `header: 'auto'` would automatically treat the first row as a header.              |
| `csv.comments`          | String            | `false`        | Comment indicator (for example, "#" or "//"). Lines starting with this string are skipped.                                                                                                                                                                                                      |
| `csv.skipEmptyLines`    | String            | `false`        | If `true`, lines that are completely empty (those which evaluate to an empty string) will be skipped. If set to `'greedy'`, lines that don't have any content (those which have only whitespace after parsing) will also be skipped.                                                            |
| `csv.transform`         | Function          | -              | A function to apply on each value. The function receives the value as its first argument and the column number or header name when enabled as its second argument. The return value of the function will replace the value it received. The transform function is applied before dynamicTyping. |
| `csv.delimitersToGuess` | Array             | `[',', '\t', ' | ', ';']`                                                                                                                                                                                                                                                                                        | An array of delimiters to guess from if the `delimiter` option is not set. |
| `csv.fastMode`          | Boolean           | auto-detect    | Force set "fast mode". Fast mode speeds up parsing significantly for large inputs but only works when the input has no quoted fields. Fast mode will be auto enabled if no `"` characters appear in the input.                                                                                  |

Remarks:

- A complication with the CSV format is that CSV files can come with or without an initial header line. Use `options.csv.header` to specify how to handle the first line.
- Many options are passed on to papaparse, so the [papaparse docs](https://www.papaparse.com/docs#config) can serve as a source for more information.
