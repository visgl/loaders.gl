# Overview

![bson-logo](../../images/logos/bson-logo.png)

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

| Loader / Writer | Description |
| --------------- | ----------- |
| [`BSONLoader`](/docs/modules/bson/api-reference/bson-loader) | Loads BSON binary documents into JSON-like JavaScript objects. |
| [`BSONWriter`](/docs/modules/bson/api-reference/bson-writer) | Writes JSON-like JavaScript objects as BSON binary documents. |

## Attribution

This module is a wrapper around MongoDB [js-bson](https://github.com/mongodb/js-bson) module, which is under Apache 2.0 license.
