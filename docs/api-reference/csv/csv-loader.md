# CSVLoader

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader                | Characteristic   |
| --------------------- | ---------------- |
| File Extension        | `.csv`, `.dsv`   |
| File Type             | Text             |
| Input Format          | [RFC4180](https://tools.ietf.org/html/rfc4180) |
| Output Format         | [Classic Table](/docs/specifications/category-table)   |
| Decoder Type          | Synchronous, Asynchronous |
| Worker Thread Support | No               |
| Streaming Support     | Yes              |

## Usage

```js
import {CSVLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const data = await load(url, CSVLoader, options);
```

## Options

The following options are passed on to [papaparse](https://www.papaparse.com/docs#config):


| Option        | Type      | Default      | Description       |
| ------------- | --------- | ------------ | ----------------- |
| `delimiter`   | String    | auto-detect  | The delimiting character. |
| `header`      | Boolean   | auto-detect  | If `true`, the first row of parsed data will be interpreted as field names. If `false`, the first row is interpreted as data. |
| `newline`     | String    | auto-detect  | The newline sequence. Must be `\r`, `\n`, or `\r\n`. |
| `quoteChar`   | String    | `"`          | The character used to quote fields. |
| `escapeChar`  | String    | `"`          | The character used to escape the quote character within a field. |
| `dynamicTyping` | Boolean | `true`       | If `true`, numeric and boolean data values will be converted to their type (instead if strings). |
| `comments`    | String   | `false`      | Comment indicator (for example, "#" or "//"). Lines starting with this string are skipped. |
| `skipEmptyLines` | String | `false`    | If `true`, lines that are completely empty (those which evaluate to an empty string) will be skipped. If set to `'greedy'`, lines that don't have any content (those which have only whitespace after parsing) will also be skipped. |
| `transform`   | Function | -           | A function to apply on each value. The function receives the value as its first argument and the column number or header name when enabled as its second argument. The return value of the function will replace the value it received. The transform function is applied before dynamicTyping. |
| `delimitersToGuess` | Array | `[',', '\t', '|', ';']` | An array of delimiters to guess from if the `delimiter` option is not set. |
| `fastMode`   | Boolean   | auto-detect  | Force set "fast mode". Fast mode speeds up parsing significantly for large inputs but only works when the input has no quoted fields. Fast mode will be auto enabled if no `"` characters appear in the input. |
