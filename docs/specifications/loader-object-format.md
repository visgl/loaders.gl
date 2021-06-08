# Loader Object

To be compatible with the parsing/loading functions in `@loaders.gl/core` such as `parse` and `load`, a parser needs to be described by a "loader object" conforming to the following specification.

## Loader Object Format v1.0

### Common Fields

| Field               | Type       | Default  | Description                                                     |
| ------------------- | ---------- | -------- | --------------------------------------------------------------- |
| `name`              | `String`   | Required | Short name of the loader ('OBJ', 'PLY' etc)                     |
| `extension`         | `String`   | Required | Three letter (typically) extension used by files of this format |
| `extensions`        | `String[]` | Required | Array of file extension strings supported by this loader        |
| `category`          | `String`   | Optional | Indicates the type/shape of data                                |
| `parse` \| `worker` | `Function` | `null`   | Every non-worker loader should expose a `parse` function.       |

Note: Only one of `extension` or `extensions` is required. If both are supplied, `extensions` will be used.

### Test Function

| Field      | Type       | Default  | Description                                                                                   |
| ---------- | ---------- | -------- | --------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`     | `Function` | `String` | `String[]`                                                                                    | `null` | Guesses if a binary format file is of this format by examining the first bytes in the file. If the test is specified as a string or array of strings, the initial bytes are expected to be "magic bytes" matching one of the provided strings. |
| `testText` | `Function` | `null`   | Guesses if a text format file is of this format by examining the first characters in the file |

### Parser Functions

Each (non-worker) loader should define a `parse` function. Additional parsing functions can be exposed depending on the loaders capabilities, to optimize for text parsing, synchronous parsing, streaming parsing, etc:

| Parser function field           | Type       | Default | Description                                                                            |
| ------------------------------- | ---------- | ------- | -------------------------------------------------------------------------------------- |
| `parse`                         | `Function` | `null`  | Asynchronously parses binary data (e.g. file contents) asynchronously (`ArrayBuffer`). |
| `parseInBatches` (Experimental) | `Function` | `null`  | Parses binary data chunks (`ArrayBuffer`) to output data "batches"                     |
| `parseSync`                     | `Function` | `null`  | Atomically and synchronously parses binary data (e.g. file contents) (`ArrayBuffer`)   |
| `parseTextSync`                 | `Function` | `null`  | Atomically and synchronously parses a text file (`String`)                             |

Synchronous parsers are more flexible as they can support synchronous parsing which can simplify application logic and debugging, and iterator-based parsers are more flexible as they can support batched loading of large data sets in addition to atomic loading.

You are encouraged to provide the most capable parser function you can (e.g. `parseSync` or `parseToIterator` if possible). Unless you are writing a completely new loader from scratch, the appropriate choice often depends on the capabilities of an existing external "loader" that you are working with.

### Parser Function Signatures

- `async parse(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseSync(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseInBatches(data : AsyncIterator, options : Object, context : Object) : AsyncIterator`

The `context` parameter will contain the foolowing fields

- `parse` or `parseSync`
- `url` if available
