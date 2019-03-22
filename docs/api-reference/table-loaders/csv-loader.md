# CSVLoader (Experimental)

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader                | Characteristic                                 |
| --------------------- | ---------------------------------------------- |
| File Extension        | `.csv`, `.dsv`                                 |
| File Type             | Text                                           |
| File Format           | [RFC4180](https://tools.ietf.org/html/rfc4180) |
| Category              | Table                                          |
| Parser Type           | Asynchronous                                   |
| Worker Thread Support | Yes                                            |
| Streaming Support     | Yes                                            |

## Options

The following options are passed on to [papaparse](https://www.papaparse.com/docs#config):

| Option                   | Description                                                                                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delimiter`=             | The delimiting character. By default auto-detects from a list of common delimiters (or `delimitersToGuess`).                                                                                                                                                                                    |
| `newline`=               | The newline sequence. By default auto-detects. Must be `\r`, `\n`, or `\r\n`.                                                                                                                                                                                                                   |
| `quoteChar`=`"`          | The character used to quote fields. (Note: unquoted fields are parsed correctly).                                                                                                                                                                                                               |
| `escapeChar`=`"`         | The character used to escape the quote character within a field.                                                                                                                                                                                                                                |
| `dynamicTyping`=`false`  | If true, numeric and boolean data values will be converted to their type (instead if strings).                                                                                                                                                                                                  |
| `preview`=`0`            | If > 0, only that many rows will be parsed.                                                                                                                                                                                                                                                     |
| `encoding`=              | The encoding to use when reading files. Defaults to UTF8.                                                                                                                                                                                                                                       |
| `comments`=`false`       | A string that indicates a comment (for example, "#" or "//"). When Papa encounters a line starting with this string, it will skip the line.                                                                                                                                                     |
| `skipEmptyLines`=`false` | If `true`, lines that are completely empty (those which evaluate to an empty string) will be skipped. If set to 'greedy', lines that don't have any content (those which have only whitespace after parsing) will also be skipped.                                                              |
| `transform`              | A function to apply on each value. The function receives the value as its first argument and the column number or header name when enabled as its second argument. The return value of the function will replace the value it received. The transform function is applied before dynamicTyping. |
| `delimitersToGuess`=     | An array of delimiters to guess from if the delimiter option is not set. Default is `[',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]`                                                                                                                                                     |
| `fastMode`=              | Force set "fast mode". Fast mode speeds up parsing significantly for large inputs but only works when the input has no quoted fields. Fast mode will be auto enabled if no " characters appear in the input.                                                                                    |

Notes:

- `header` - An array of field names will be returned in meta, and each row of data will be an object of values keyed by field name instead of a simple array. Rows with a different number of fields from the header row will produce an error. Warning: Duplicate field names will cause values to be overwritten.
- `dynamicTyping` - Numeric data must conform to the definition of a decimal literal. European-formatted numbers must have commas and dots swapped. If also accepts an object or a function. If object it's values should be a boolean to indicate if dynamic typing should be applied for each column number (or header name if using headers). If it's a function, it should return a boolean value for each field number (or name if using headers) which will be passed as first argument.

Note that the following `papaparse` options are NOT supported by `CSVLoader` (they are either already used internally or they interfere with the more flexible data loading and parsing model used by `loaders.gl`):

| Option             | Description                                                                  | Reason/Replacement                                                              |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `header`=`false`   | If true, the first row of parsed data will be interpreted as field names. \* |
| `transformHeader`= | Function to apply on each header.                                            | (Only available in version 5.0)                                                 |
| `worker`           | Whether to use a worker thread.                                              | Use `CSVWorkerLoader` instead.                                                  |
| `step`             | Callback function for streaming.                                             | Use `loadFileInBatches` instead.                                                |
| `complete`         | Callback function for streaming.                                             | Use `loadFileInBatches` instead.                                                |
| `error`            | Callback function for error.                                                 | Errors will be handled by `CSVLoader`.                                          |
| `download`         | First argument is URL from which to download a file.                         | Use external functions to load data (such as `fetch` or `fetchFile`).           |
| `chunk`            | Callback executed after every chunk is loaded.                               | Use `loadFileInBatches` instead.                                                |
| `beforeFirstChunk` | Callback executed before parsing of first chunk.                             | Use `loadFileInBatches` instead.                                                |
| `withCredentials`  | `XMLHttpRequest.withCredentials` property.                                   | Control credentials using your loading functions (e.g. `fetch` or `fetchFile`). |

## Attributions

CSVLoader is based on a minimal fork of the [papaparse](https://github.com/mholt/PapaParse) module, under MIT license.
