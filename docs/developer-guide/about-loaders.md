# Using Loaders

loaders.gl has parser functions that use so called "loaders" to convert the raw data loaded from files into parsed objects. Each loader encapsulates a parsing function for one file format (or a group of related file formats) together with some metadata (like the loader name, common file extensions for the format etc).

## Installing loaders

loaders.gl provides a suite of pre-built loader objects packaged as scoped npm modules. The intention is that applications will install and import loaders only for the formats they need.

## Using Loaders

Loaders can be passed into utility functions in the loaders.gl core API to enable parsing of the chosen format.

## Creating New Loaders

> See the a detailed specification of the [loader object format API reference](docs/specifications/loader-object-format).

Applications can also create new loader objects. E.g. if you have existing JavaScript parsing functionality that you would like to use with the loaders.gl core utility functions.

You would give a name to the loader object, define what file extension(s) it uses, and define a parser function.

```js
export default {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync: JSON.parse
};
```

| Field       | Type     | Default  | Description                                                     |
| ----------- | -------- | -------- | --------------------------------------------------------------- |
| `name`      | `String` | Required | Short name of the loader ('OBJ', 'PLY' etc)                     |
| `extension` | `String` | Required | Three letter (typically) extension used by files of this format |
| `testText` | `Function` | `null`  | Guesses if a file is of this format by examining the first characters in the file |

A loader must define a parser function for the format, a function that takes the loaded data and converts it into a parsed object.

Depending on how the underlying loader works (whether it is synchronous or asynchronous and whether it expects text or binary data), the loader object can expose the parser in a couple of different ways, specified by provided one of the parser function fields.
