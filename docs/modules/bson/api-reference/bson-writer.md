# BSONWriter

![bson-logo](../../../images/logos/bson-logo.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

Writer for BSON files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Format    | [BSON](/docs/modules/bson/formats/bson)                           |
| Data Format    | [Unstructured/JSON](/docs/specifications/category-json) |
| File Extension | `.bson`                                                 |
| Media Type     | `application/bson`                                      |
| File Type      | Binary                                                  |
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
