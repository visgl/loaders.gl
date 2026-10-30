---
title: BSON
description: Read and write BSON documents through the loaders.gl API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StructuredDataPathGraphic} from '@site/src/components/docs/structured-data-path-graphic';

<DocPageHeader
  format="bson"
  eyebrow="Documents · BSON"
  title="Keep JSON-like documents in a binary form."
  description="`@loaders.gl/documents` loads and writes BSON documents as JavaScript objects. It is useful when a binary document format is required but the application wants the familiar JSON data model."
  tone="yellow"
  meta={['BSON documents', 'Loader and writer', 'JSON-like objects']}
  links={[
    {label: 'BSON format', to: '/docs/modules/documents/bson/formats/bson'},
    {label: 'BSON loader', to: '/docs/modules/documents/bson/api-reference/bson-loader'},
    {label: 'BSON writer', to: '/docs/modules/documents/bson/api-reference/bson-writer'}
  ]}
/>

<StructuredDataPathGraphic />

<DocOrientation
  eyebrow="The BSON path"
  title="Decode binary documents. Work with objects. Encode them again."
  description="The module keeps the representation boundary simple: BSON bytes at the edge, ordinary JavaScript values in the application, and BSON bytes when writing."
  tone="yellow"
  items={[
    {label: 'Input', value: 'BSON binary documents'},
    {label: 'Decode', value: 'MongoDB-compatible JavaScript objects'},
    {label: 'Application', value: 'JSON-like values and nested documents'},
    {label: 'Output', value: 'BSON binary documents'}
  ]}
/>

<ReferenceBoundary
  title="Loader and writer details"
  description="The reference below covers installation, entry points, supported data representation, and the native BSON codec."
  tone="yellow"
/>


<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

The `@loaders.gl/documents` module provides support for the [BSON](/docs/modules/documents/bson/formats/bson) format.
The BSON format stores arbitrary (loosely structured) data largely equivalent to the textual JSON format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/documents
```

The native codec runs in browsers and Node.js without an external BSON dependency.

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`BSONLoader`](/docs/modules/documents/bson/api-reference/bson-loader) | Loads BSON binary documents into JSON-like JavaScript objects. |
| [`BSONWriter`](/docs/modules/documents/bson/api-reference/bson-writer) | Writes JSON-like JavaScript objects as BSON binary documents. |

## Attribution

The codec is an original loaders.gl implementation of the [BSON specification](https://bsonspec.org/spec.html). Historical test fixtures retain their upstream notices.


## Native value representations

The codec supports all BSON element types, including deprecated types. It does not
provide MongoDB driver classes, Extended JSON parsing, or Decimal128 arithmetic.

| BSON type | Decoded JavaScript value |
| --- | --- |
| Document / array | Plain object / array |
| String, boolean, null, double, int32 | Corresponding JavaScript value |
| Int64 | Number when safe; otherwise bigint. Options can request bigint or a typed scalar. |
| ObjectId | `BSONObjectId`; `toString()` returns 24 lowercase hexadecimal characters. |
| Date | `Date` when representable; otherwise a `date` scalar containing int64 milliseconds. |
| Binary subtype 0 | Copied `Uint8Array` |
| Other binary subtypes | `binary` scalar with `subtype` and `data`; payloads remain opaque. |
| Decimal128 | `decimal128` scalar with the exact 16 wire bytes. |
| Timestamp | `timestamp` scalar containing the unsigned 64-bit bit pattern. |
| Regular expression | `regexp` scalar with `pattern` and sorted BSON `options`. |
| Code / code with scope | `code` scalar with source text and optional `scope` document. |
| Symbol / DBPointer | `symbol` or `dbPointer` scalar preserving its payload. |
| Undefined / MinKey / MaxKey | `undefined`, `minKey`, or `maxKey` scalar. |

Create explicit scalars with `createBSONValue()`. Decoded scalars already carry a private,
non-enumerable symbol brand, so a normal document containing a `$bsonType` key is never
mistaken for a scalar. JSON serialization and structured cloning lose this brand;
recreate the scalar explicitly afterward. MongoDB class instances are not accepted.

```typescript
import {BSONObjectId, createBSONValue, encodeBSONSync, parseBSONSync} from '@loaders.gl/documents/bson-codec';

const bytes = encodeBSONSync({
  id: new BSONObjectId('0123456789abcdef01234567'),
  count: 9007199254740993n,
  timestamp: createBSONValue({$bsonType: 'timestamp', value: 42n})
});
const document = parseBSONSync(bytes);
```

Plain numbers encode as int32 when integral and in range, otherwise as double
(including negative zero, infinities, and NaN). Bigints encode as signed int64.
Use `preserveTypes: true` when decoding to retain numeric wire types for re-encoding;
without it, a safe int64 or an integral double may later encode as int32.
Native regular expressions are accepted for writing but decode into unevaluated scalars.

## Embedded BSON in Parquet

Parquet BSON columns use this same synchronous codec for document encoding and row
materialization. Arrow output preserves the encoded bytes in Binary columns; use
`parseBSONSync()` for explicit document decoding. No optional BSON backend is required.
