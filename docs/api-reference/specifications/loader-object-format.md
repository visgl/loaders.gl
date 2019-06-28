# Loader Object Specification

To be compatible with the parsing/loading functions in `@loaders.gl/core` such as `parse` and `load`, a parser needs to be described by a "loader object" conforming to the following specification.

## Loader Object Format v1.0

### Common Fields

| Field        | Type       | Default  | Description                                                     |
| ------------ | ---------- | -------- | --------------------------------------------------------------- |
| `name`       | `String`   | Required | Short name of the loader ('OBJ', 'PLY' etc)                     |
| `extension`  | `String`   | Required | Three letter (typically) extension used by files of this format |
| `extensions` | `String[]` | Required | Array of file extension strings supported by this loader        |
| `category`   | `String`   | Optional | Indicates the type/shape of data                                |

Note: Only one of `extension` or `extensions` is required. If both are supplied, `extensions` will be used.

### Test Function

| Field      | Type       | Default | Description                                                                       |
| ---------- | ---------- | ------- | --------------------------------------------------------------------------------- |
| `test` | `Function`|`String`|`String[]` | `null`  | Guesses if a binary format file is of this format by examining the first bytes in the file. If the test is specified as a string or array of strings, the initial bytes are expected to be "magic bytes" matching one of the provided strings. |
| `testText` | `Function` | `null`  | Guesses if a text format file is of this format by examining the first characters in the file |

### Parser Function

When creating a new loader object, at least one of the parser functions needs to be defined.

| Parser function field               | Type       | Default | Description                                                                            |
| ----------------------------------- | ---------- | ------- | -------------------------------------------------------------------------------------- |
| `parseInBatches` (Experimental)     | `Function` | `null`  | Parses binary data chunks (`ArrayBuffer`) to output data "batches"                     |
| `parseInBatchesSync` (Experimental) | `Function` | `null`  | Synchronously parses binary data chunks (`ArrayBuffer`) to output data "batches"       |
| `parseSync`                         | `Function` | `null`  | Atomically and synchronously parses binary data (e.g. file contents) (`ArrayBuffer`)   |
| `parseTextSync`                     | `Function` | `null`  | Atomically and synchronously parses a text file (`String`)                             |
| `parse`                             | `Function` | `null`  | Asynchronously parses binary data (e.g. file contents) asynchronously (`ArrayBuffer`). |
| `loadAndParse`                      | `Function` | `null`  | Asynchronously reads a binary file and parses its contents.                            |

Note: Only one parser function is required. Synchronous parsers are more flexible as they can support synchronous parsing in addition to asynchronous parsing, and iterator-based parsers are more flexible as they can support batched loading in addition to atomic loading. You are encouraged to provide the most capable parser function you can (e.g. `parseSync` or `parseToIterator` if possible). Unless you are writing a completely new loader, the appropriate choice usually depends on the loader you are encapsulating.
