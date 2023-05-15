# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

The `@loaders.gl/bson` module provides support for the [BSON](/docs/modules/bson/formats/bson) format. 
The BSON format stores arbitrary (loosely structured) data largely equivalent to the textual JSON format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/bson
```

## Loaders and Writers

| Loader                                                       |
| ------------------------------------------------------------ |
| [`BSONLoader`](/docs/modules/bson/api-reference/bson-loader) |
| [`BSONWriter`](/docs/modules/bson/api-reference/bson-writer) |

## Attribution

This module is a wrapper around MongoDB [js-bson](https://github.com/mongodb/js-bson) module, which is under Apache 2.0 license.
