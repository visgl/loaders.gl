BSON API · document loader

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

# Decode typed documents at the application boundary.

BSONLoader parses BSON bytes into JSON-like JavaScript values with lossless representations for BSON-specific scalar types.

[BSON format](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[BSONWriter](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)[Documents · BSON](https://loaders.gl/next/docs/modules/documents/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson.md)

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/documents/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

The decode path

## Read BSON once, then work with ordinary document values.

The loader decodes BSON directly without an external backend. Application code receives the decoded document and can decide whether to inspect, transform, or re-encode it.

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

Native decode and nesting options

Detailed guide

## BSONLoader reference

The sections below document installation, usage, native options and decoded value representations.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

`BSONLoader` loads BSON binary documents into JSON-like JavaScript objects.

## Installation[​](#installation "Direct link to Installation")

BSON decoding and encoding are implemented natively; no `bson` package is needed.

```
npm install @loaders.gl/core @loaders.gl/documents
```

Install `@loaders.gl/documents`. Its root contains metadata; use flat subpaths for implementations.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {BSONLoader} from '@loaders.gl/documents';



const data = await load(url, BSONLoader, {bson: options});
```

## BSONLoader Options[​](#bsonloader-options "Direct link to BSONLoader Options")

| Option                       | Default   | Behavior                                                                                                           |
| ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `bson.concatenatedDocuments` | `'error'` | Reject concatenated dump documents, or use `'first'` to decode only the first.                                     |
| `bson.promoteLongs`          | `true`    | Return safe int64 values as numbers; unsafe values remain bigint. Set false for tagged int64 values.               |
| `bson.useBigInt64`           | `false`   | Return int64 values as bigint, overriding `promoteLongs`.                                                          |
| `bson.preserveTypes`         | `false`   | Preserve double, int32, and int64 wire types using native scalar markers; takes precedence over integer promotion. |
| `bson.maxDepth`              | `100`     | Maximum document/array nesting, including the root and JavaScript code scopes.                                     |

Strings are strictly validated as UTF-8. Invalid lengths, terminators, array indexes, boolean values, unknown element types, and reads outside nested document boundaries are rejected. Duplicate document keys use the last value. Prototype-sensitive keys remain ordinary own properties and never modify object prototypes. Stored code and regex patterns are not executed.

## Value representations[​](#value-representations "Direct link to Value representations")

See the [native BSON value contract](https://loaders.gl/next/docs/modules/documents/bson.md#native-value-representations).

For synchronous parsing, import `BSONLoaderWithParser` from `@loaders.gl/documents/bson-loader` and pass it to `parseSync`.
