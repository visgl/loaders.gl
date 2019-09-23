# Overview

The `@loaders.gl/core` module contains the core API of loaders.gl

The core API offers functions to parse data in various ways using loaders

- [`parse`](modules/core/docs/api-reference/parse)
- [`parseSync`](modules/core/docs/api-reference/parseSync)
- [`parseInBatches`](modules/core/docs/api-reference/parseInBatches)

To fetch data

- [`fetchFile`](modules/core/docs/api-reference/fetchFile)

To load (fetch and parse) data

- [`load`](modules/core/docs/api-reference/load)

To register loaders, or select a loader that matches a file from a list of candidate loaders:

- [`registerLoaders`](modules/core/docs/api-reference/registerLoaders)
- [`selectLoader`](modules/core/docs/api-reference/selectLoader)

To encode and save data

- [`encode`](modules/core/docs/api-reference/encode)
- [`write-file`](modules/core/docs/api-reference/file)
- [`save`](modules/core/docs/api-reference/save)

As well as some utility functions.
