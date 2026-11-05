BSON API · document writer

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

# Put typed document values back on the wire.

BSONWriter serializes JSON-like JavaScript objects into BSON bytes, including explicitly typed native BSON scalar values.

[BSON format](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[BSONLoader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[Documents · BSON](https://loaders.gl/next/docs/modules/documents/bson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/bson.md)

[![](/next/images/format-logos/bson-logo.png)](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Try It](https://loaders.gl/next/examples/table/bson)[Overview](https://loaders.gl/next/docs/modules/documents/bson/formats/bson.md)[Format](https://loaders.gl/next/docs/modules/documents/bson/format.md)[BSONLoader](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-loader.md)[BSONWriter](https://loaders.gl/next/docs/modules/documents/bson/api-reference/bson-writer.md)

The encode path

## Serialize a document without flattening its richer scalar types.

Pass ordinary object structures and BSON-aware values to the writer. It encodes BSON directly without an external backend.

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

Native encode and nesting options

Detailed guide

## BSONWriter reference

The sections below document installation, usage, native options and encoded value representations.

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

`BSONWriter` writes JSON-like JavaScript objects as BSON binary documents.

## Installation[​](#installation "Direct link to Installation")

BSON decoding and encoding are implemented natively; no `bson` package is needed.

```
npm install @loaders.gl/core @loaders.gl/documents
```

Install `@loaders.gl/documents`. Its root contains metadata; use flat subpaths for implementations.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import {BSONWriter} from '@loaders.gl/documents/bson-writer';



const arrayBuffer = await encode(data, BSONWriter);
```

## BSONWriter Options[​](#bsonwriter-options "Direct link to BSONWriter Options")

| Option                 | Default | Behavior                                                                                                                    |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `bson.ignoreUndefined` | `true`  | Omit undefined object properties. Set false to encode them as null. Undefined and sparse array slots always encode as null. |
| `bson.maxDepth`        | `100`   | Maximum document/array nesting, including the root and code scopes.                                                         |

Both async `encode()` and `encodeSync()` honor these options. Cycles, invalid dates, int64 values outside their representable range, unsupported objects, and field names containing null characters are rejected. Regular expressions must use BSON-supported flags (`i`, `l`, `m`, `s`, `u`, `x`); use a native scalar marker for BSON-only regex flags. Use an explicit `undefined` BSON marker to write the deprecated BSON undefined type.

## Value representations[​](#value-representations "Direct link to Value representations")

See the [native BSON value contract](https://loaders.gl/next/docs/modules/documents/bson.md#native-value-representations).
