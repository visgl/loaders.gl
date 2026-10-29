BSON API · document loader

![](/next/images/format-logos/bson-logo.png)

# Decode typed documents at the application boundary.

BSONLoader parses BSON bytes into JSON-like JavaScript values while preserving the extended scalar types supported by the underlying js-bson implementation.

[BSON format](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[BSONWriter](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)[BSON module](https://loaders.gl/next/docs/modules/tables/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson.md)

![](/next/images/format-logos/bson-logo.png)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/tables/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

The decode path

## Read BSON once, then work with ordinary document values.

The loader owns binary parsing and delegates format-specific options to js-bson. Application code receives the decoded document and can decide whether to inspect, transform, or re-encode it.

01

Input

BSON binary document bytes

02

Output

JSON-like JavaScript object values

03

Types

Dates, int64, decimal128, bytes, and nested documents

04

Options

Forwarded to the underlying js-bson parser

Detailed guide

## BSONLoader reference

The sections below document installation, usage, option forwarding, decoded values, and the js-bson attribution boundary.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

`BSONLoader` loads BSON binary documents into JSON-like JavaScript objects.

## Installation[​](#installation "Direct link to Installation")

Install `bson` to use this API. It is an optional dependency of `@loaders.gl/tables`.

```
npm install @loaders.gl/core @loaders.gl/tables bson@4.2.0
```

For grouped imports, install `@loaders.gl/tables` in place of `@loaders.gl/tables/bson` and keep `bson` installed.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {BSONLoader} from '@loaders.gl/tables/bson';



const data = await load(url, BSONLoader, {bson: options});
```

## BSONLoader Options[​](#bsonloader-options "Direct link to BSONLoader Options")

`BSONLoader` currently passes `bson` options through to the underlying MongoDB `js-bson` parser. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution[​](#attribution "Direct link to Attribution")

This loader is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
