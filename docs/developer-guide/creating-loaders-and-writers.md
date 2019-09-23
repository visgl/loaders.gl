# Creating New Loaders and Writers

> See the a detailed specification of the [loader object format API reference](docs/specifications/loader-object-format).

## Overview

Applications can also create new loader objects. E.g. if you have existing JavaScript parsing functionality that you would like to use with the loaders.gl core utility functions.

## Creating a Loader Object

You would give a name to the loader object, define what file extension(s) it uses, and define a parser function.

```js
export default {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parse: async (arrayBuffer) => await JSON.parse(new TextDecoder().decode(arrayBuffer),
  parseTextSync: JSON.parse
};
```

| Field       | Type       | Default  | Description                                                                       |
| ----------- | ---------- | -------- | --------------------------------------------------------------------------------- |
| `name`      | `String`   | Required | Short name of the loader ('OBJ', 'PLY' etc)                                       |
| `extension` | `String`   | Required | Three letter (typically) extension used by files of this format                   |
| `testText`  | `Function` | `null`   | Guesses if a file is of this format by examining the first characters in the file |

A loader must define a parser function for the format, a function that takes the loaded data and converts it into a parsed object.

Depending on how the underlying loader works (whether it is synchronous or asynchronous and whether it expects text or binary data), the loader object can expose the parser in a couple of different ways, specified by provided one of the parser function fields.

## Dependency Management

In general, it is recommended that loaders are "standalone" and avoid importing `@loaders.gl/core`. `@loaders.gl/loader-utils` provides a small set of shared loader utilities.
