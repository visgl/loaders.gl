# BSONLoader

This loader is part of the [`@loaders.gl/bson`](/docs/modules/bson) module.


Streaming loader for BSON encoded files.

| Loader         | Characteristic                                          |
| -------------- | ------------------------------------------------------- |
| File Format    | [BSON](/docs/modules/bson/formats/bson)                 |
| Data Format    | [Unstructured/JSON](/docs/specifications/category-json) |
| File Extension | `.bson`                                                 |
| Media Type     | `application/bson`                                      |
| File Type      | Binary                                                  |
| Supported APIs | `load`, `parse`, `parseSync`                            |

## Usage

For simple usage, you can load and parse a BSON file atomically:

```js
import {BSONLoader} from '@loaders.gl/bson';
import {load} from '@loaders.gl/core';

const data = await load(url, BSONLoader, {bson: options});
```


## Options

Supports table category options such as `batchType` and `batchSize`.

| Option | From | Type | Default | Description |
| ------ | ---- | ---- | ------- | ----------- |

Note: Currently passes through options to the underlying `js-bson` module 
but this may change in future versions and should not be relied upon.
