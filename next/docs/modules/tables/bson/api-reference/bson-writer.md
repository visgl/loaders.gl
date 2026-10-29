BSON API · document writer

![](/next/images/format-logos/bson-logo.png)

# Put typed document values back on the wire.

BSONWriter serializes JSON-like JavaScript objects into BSON bytes, including the extended scalar values supported by the underlying js-bson implementation.

[BSON format](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[BSONLoader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSON module](https://loaders.gl/next/docs/modules/tables/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/bson.md)

![](/next/images/format-logos/bson-logo.png)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/tables/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

The encode path

## Serialize a document without flattening its richer scalar types.

Pass ordinary object structures and BSON-aware values to the writer. It delegates serialization details to js-bson while keeping the loaders.gl encode API consistent with other writers.

01

Input

JSON-like JavaScript objects and nested values

02

Output

ArrayBuffer containing one BSON document

03

Types

Extended BSON scalar values remain available

04

Options

Forwarded to the underlying js-bson serializer

Detailed guide

## BSONWriter reference

The sections below document installation, usage, option forwarding, output bytes, and the js-bson attribution boundary.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

`BSONWriter` writes JSON-like JavaScript objects as BSON binary documents.

## Installation[​](#installation "Direct link to Installation")

Install `bson` to use this API. It is an optional dependency of `@loaders.gl/tables`.

```
npm install @loaders.gl/core @loaders.gl/tables bson@4.2.0
```

For grouped imports, install `@loaders.gl/tables` in place of `@loaders.gl/tables/bson` and keep `bson` installed.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import {BSONWriter} from '@loaders.gl/tables/bson';



const arrayBuffer = await encode(data, BSONWriter);
```

## BSONWriter Options[​](#bsonwriter-options "Direct link to BSONWriter Options")

`BSONWriter` currently passes `bson` options through to the underlying MongoDB `js-bson` serializer. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution[​](#attribution "Direct link to Attribution")

This writer is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
