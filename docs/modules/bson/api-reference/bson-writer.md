# BSONWriter

Write for BSON files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.bson`                                                 |
| Media Type     | `application/bson`                                      |
| File Type      | Binary                                                  |
| File Format    | [BSON](https://bsonspec.org/)                           |
| Data Format    | [Unstructured/HSON](/docs/specifications/category-json) |
| Supported APIs | `encode`, `encodeSync`                            |

## Usage

```js
import {BSONWriter} from '@loaders.gl/json';
import {encode} from '@loaders.gl/core';

const arrayBufer = await encode(data, BSONWriter);
```

## Options

N/A

Note: Currently passes through options to the underlying `js-bson` module 
but this may change in future versions and should not be relied upon.
