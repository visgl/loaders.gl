# Creating New Loaders

> This is an overview, see the  a detailed specification of the [loader object format API reference](docs/api-reference/specifications/writer-object-formats).

loaders.gl has parser functions that use so called "loaders" (or "loader objects") to convert the raw data loaded from files into parsed objects. Each loader object encapsulates a loader for one file format and essentially provides a parsing function and some metadata (like the loader name, common file extensions for the format etc). Loader object can be passed into utility functions in the loaders.gl core API to enable parsing of the chosen format.

loaders.gl provides a suite of pre-built loader objects packaged as scoped npm modules. Your application can install and combine these as desired. It is also easy to create your own loader objects, e.g. if you have existing javascript loaders that you would like to use with the loaders.gl core utility functions.

### Common Fields

You would give a name to the loader object, define what file extension(s) it uses.


| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `name`          | `String`    | Required   | Short name of the loader ('OBJ', 'PLY' etc) |
| `extension`     | `String`    | Required   | Three letter (typically) extension used by files of this format |



### Test Function

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `testText`      | `Function`  | `null`     | Guesses if a file is of this format by examining the first characters in the file |


### Parser Function

A loader must define a parser function for the format, a function that takes the loaded data and converts it into a parsed object. Depending on how the underlying loader works (whether it is synchronous or asynchronous and whether it expects text or binary data), the loader object can expose the parser in a couple of different ways, specified by provided one of the parser function fields.

The loaders.gl `loadFile` and `parseFile` functions accept one or more loader objects. These functions examines what format the loader needs (text or binary), reads data into the required format, and then calls one of the loader object's parser functions with that data.

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


## Remarks

* The reason synchronous parsers are preferred is e.g. that it is often easier to debug synchronous parsers, so it is nice to have the option to run things synchronously. And no functionality is lost, as loaders.gl core utlities will still transparently run these parsers asynchronously on worker threads or wrap them in promises if desired.
* The reason pure parsers that don't read/reuqest data but just parse it are preferred is because it gives more freedom to the application to select how data is loaded.
