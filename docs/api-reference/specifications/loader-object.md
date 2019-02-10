# Loader Object Specification

To be compatible with loaders.gl functions, loader objects need to conform to the following specification:

## v1.0 Loader Object

### Common Fields

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `name`          | `String`    | Required   | Short name of the loader ('OBJ', 'PLY' etc) |
| `extension`     | `String`    | Required   | Three letter (typically) extension used by files of this format |
| `category`      | `String`    | Optional   | Indicates the type/shape of data |


### Test Function

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `testText`      | `Function`  | `null`     | Guesses if a file is of this format by examining the first characters in the file |


### Parser Function

When creating a new loader object, at least one of the parser functions needs to be defined:

| Parser function field | Type        | Default    | Description |
| ---                   | ---         | ---        | ---         |
| `parseTextSync`       | `Function`  | `null`     | Parses a text file synchronously (`String`) |
| `parseSync`           | `Function`  | `null`     | Parses a binary file synchronously (`ArrayBuffer`) |
| `parse`               | `Function`  | `null`     | Parses a binary file asynchronously (`ArrayBuffer`) |
| `load`                | `Function`  | `null`     | Reads and parses a binary file asynchronously |


* The preferred option is to provide a synchronous parser that works on loaded data (using the `parseSync` or `parseTextSync` fields). This allows the use of the `loadFileSync` and `parseFileSync` functions with your loader.
* The second preference is to provide an asynchronous parser that works on loaded data (`parse`). This allows the user to load the data using any preferred mechanism, and only use loaders.gl for parsing by calling `parseFile` on the loaded data.
* Finally, some existing parsers combine both loading and parsing, and loaders.gl provides an accommodation for packaging such loaders into loader options (`load`). The `load` parser field is for instance used to define a loader object using the classic browser image loading technique of creating a new `Image` and setting its `src` and `onload` fields.


## v0.5 Loader Object (DEPRECATED)

Each loader has a Loader object that provides metadata about that loader, and functions to parse and test data.

The loader object has the following fields:

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `name`          | `String`    | Required   | Short name of the loader ('OBJ', 'PLY' etc) |
| `extension`     | `String`    | Required   | Three letter (typically) extension used by files of this format |
| `testText`      | `Function`  | `null`     | Guesses if a file is of this format by examining the first characters in the file |
| `loadText`      | `Function`  | `null`     | Parses a text file (`String`) |
| `loadBinary`    | `Function`  | `null`     | Parses a binary file (`ArrayBuffer`) |


## Remarks

* The reason synchronous parsers are preferred is e.g. that it is often easier to debug synchronous parsers, so it is nice to have the option to run things synchronously. And no functionality is lost, as loaders.gl core utlities will still transparently run these parsers asynchronously on worker threads or wrap them in promises if desired.
* The reason pure parsers that don't read/reuqest data but just parse it are preferred is because it gives more freedom to the application to select how data is loaded.
