# Overview

The `@loaders.gl/core` module contains the core API of loaders.gl

The core API offers functions to parse data in various ways using loaders

- [`parse`](/docs/modules/core/api-reference/parse)
- [`parseSync`](/docs/modules/core/api-reference/parseSync)
- [`parseInBatches`](/docs/modules/core/api-reference/parseInBatches)

To fetch data

- [`fetchFile`](/docs/modules/core/api-reference/fetchFile)

To load (fetch and parse) data

- [`load`](/docs/modules/core/api-reference/load)

To register loaders, or select a loader that matches a file from a list of candidate loaders:

- [`registerLoaders`](/docs/modules/core/api-reference/registerLoaders)
- [`selectLoader`](/docs/modules/core/api-reference/selectLoader)

To encode and save data

- [`encode`](/docs/modules/core/api-reference/encode)
- [`write-file`](/docs/modules/core/api-reference/file)
- [`save`](/docs/modules/core/api-reference/save)

As well as some utility functions.

## Micro-Loaders

Loaders with limited functionality but with minimal bundle size impact:

| Loader       | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `JSONLoader` | A minimal non-streaming JSON loader that uses the built-in `JSON.parse` function |
| `NullLoader` | A loader-object that ignores input data and always returns `null`.               |
