---
title: BSON - Binary JSON
description: Store JSON-like documents with explicit binary scalar types and compact traversal-friendly records.
hide_title: true
page_style: designed
---

import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StructuredDataPathGraphic} from '@site/src/components/docs/structured-data-path-graphic';

<DocPageHeader
  format="bson"
  eyebrow="Document binary format"
  title="Keep JSON-like documents typed on the wire."
  description="BSON is a binary document format with explicit scalar types such as dates, 64-bit integers, decimals, byte arrays, and regular expressions. loaders.gl exposes it through the same loader and writer boundaries used by other formats."
  tone="yellow"
  meta={['Binary JSON', 'Typed scalar values', 'Native codec']}
  links={[
    {label: 'BSON module', to: '/docs/modules/tables/bson'},
    {label: 'BSONLoader', to: '/docs/modules/tables/bson/api-reference/bson-loader'},
    {label: 'BSONWriter', to: '/docs/modules/tables/bson/api-reference/bson-writer'}
  ]}
/>

<BsonDocsTabs active="overview" />

<StructuredDataPathGraphic />

<DocOrientation
  eyebrow="BSON feature card"
  title="Read and write BSON with a native codec."
  description="The loaders.gl codec runs in browsers and Node.js without the bson package. It supports every BSON element type, with explicit representations for values that JavaScript cannot express directly."
  tone="yellow"
  items={[
    {label: 'Runtime', value: 'Native browser and Node.js codec; no BSON package'},
    {label: 'Types', value: 'All element types, including lossless special scalars'},
    {label: 'Parquet', value: 'Document read/write; Arrow Binary byte output'},
    {label: 'Validation', value: 'Checked lengths, UTF-8, depth, cycles; code stays data'}
  ]}
/>

<ReferenceBoundary
  title="BSON structure and compatibility"
  description="The reference below covers BSON data types, Extended JSON, binary layout, efficiency trade-offs, and the loaders.gl entry points."
  tone="yellow"
/>

The BSON ("Binary JSON") specification defines a binary format for storing JSON-like data with additional scalar types and explicit type information.

- _[`@loaders.gl/tables/bson`](/docs/modules/tables/bson)_
- _[BSON specification](https://bsonspec.org/)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/BSON)_

## Data Types and Syntax

The topmost element in a BSON structure must be a BSON object. Each object contains zero or more elements, where each element has a field name, a type, and a value. Field names are strings.

BSON types include Unicode strings, 32-bit integers, 64-bit integers, doubles, decimal128 values, datetimes, byte arrays, booleans, nulls, nested BSON objects, BSON arrays, JavaScript code, MD5 binary data, and regular expressions.

## EJSON (Extended JSON)

BSON contains types not present in JSON, such as datetimes, byte arrays, and type-specific numeric values. MongoDB's Extended JSON format can represent those BSON values in textual JSON-compatible form.
The native loaders.gl codec reads and writes binary BSON; it does not parse or generate EJSON.
See the [native value representations](/docs/modules/tables/bson#native-value-representations)
for explicit scalar construction and numeric promotion options.

## loaders.gl support

Use `BSONLoader` and `BSONWriter` from `@loaders.gl/tables/bson`, or call
`parseBSONSync()` and `encodeBSONSync()` directly. BSON-specific scalars use
`BSONObjectId` or values constructed with `createBSONValue()`. Code and regular
expressions are preserved as data and are never evaluated while decoding.

All binary subtypes are preserved, including opaque compressed, encrypted, and vector
payloads; preserving their bytes does not decode the subtype-specific content.
Parquet's BSON columns use the same codec for document materialization. Arrow output
retains the BSON bytes for explicit decoding. See the [BSON module](/docs/modules/tables/bson)
and [migration guide](/docs/upgrade-guide#native-bson-value-contract).

## Efficiency

Compared to JSON, BSON is designed for efficient storage and scanning. Large elements in a BSON document are prefixed with a length field to support fast traversal. In some cases, BSON uses more space than JSON due to length prefixes and explicit array indices.

## History

BSON originated in 2009 at MongoDB. It is used as a data storage and network transfer format for MongoDB, but it can also be used independently outside MongoDB.

## Example

A JSON document such as:

```typescript
{"hello": "world"}
```

is stored as BSON bytes equivalent to:

```typescript
\x16\x00\x00\x00          // total document size
\x02                      // 0x02 = type String
hello\x00                 // field name
\x06\x00\x00\x00world\x00 // field value size, value, null terminator
\x00                      // 0x00 = EOO, end of object
```
