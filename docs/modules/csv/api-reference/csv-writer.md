# CSVWriter

Writes tabular data into comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoding.

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
import {encode} from '@loaders.gl/core';
import {Table} from '@loaders.gl/schema';
import {CSVLoader} from '@loaders.gl/csv';

const table: Table = ...;

const data = await encode(table, CSVLoader); // ArrayBuffer
// or
const text = await encodeAsText(url, CSVLoader); // string
// or
const iterator = await encodeInBatches(url, CSVLoader, {csv: options}); // Iterable<ArrayBuffer>
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- ||
| `csv.header`        | Boolean \| String | `auto`      | If `true`, the first row of parsed data will be interpreted as field names. If `false`, the first row is interpreted as data.                                                                                                                                                                   |
| `csv.columnPrefix`  | String            | `column`    | The prefix to use when naming columns for CSV files with no header. Defaults to 'column1', 'column2' etc.                                                                                                                                                                                       |
| `csv.delimiter`     | String            | auto-detect | The delimiting character.                                                                                                                                                                                                                                                                       |
| `csv.newline`       | String            | auto-detect | The newline sequence. Must be `\r`, `\n`, or `\r\n`.                                                                                                                                                                                                                                            |
| `csv.quoteChar`     | String            | `"`         | The character used to quote fields.                                                                                                                                                                                                                                                             |
| `csv.escapeChar`    | String            | `"`         | The character used to escape the quote character within a field.                                                                                                                                                                                                                                |
| `csv.dynamicTyping` | Boolean           | `true`      | If `true`, numeric and boolean data values will be converted to their type (instead if strings. **Note**: if you disable `dynamicTyping`, you need to explicitly set `header` to a boolean value. Otherwise, `header: 'auto'` would automatically treat the first row as a header.              |
| `csv.comments`      | String            | `false`     | Comment indicator (for example, "#" or "//"). Lines starting with this string are skipped.                                                                                                                                                                                                      |
| `csv.transform`     | Function          | -           | A function to apply on each value. The function receives the value as its first argument and the column number or header name when enabled as its second argument. The return value of the function will replace the value it received. The transform function is applied before dynamicTyping. |
