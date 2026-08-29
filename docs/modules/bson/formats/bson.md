---
title: BSON - Binary JSON
description: Store JSON-like documents with explicit binary scalar types and compact traversal-friendly records.
hide_title: true
page_style: designed
---

import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Document binary format"
  title="Keep JSON-like documents typed on the wire."
  description="BSON is a binary document format with explicit scalar types such as dates, 64-bit integers, decimals, byte arrays, and regular expressions. loaders.gl exposes it through the same loader and writer boundaries used by other formats."
  tone="yellow"
  meta={['Binary JSON', 'Typed scalar values', 'MongoDB js-bson']}
  links={[
    {label: 'BSON module', to: '/docs/modules/bson'},
    {label: 'BSONLoader', to: '/docs/modules/bson/api-reference/bson-loader'},
    {label: 'BSONWriter', to: '/docs/modules/bson/api-reference/bson-writer'}
  ]}
/>

<BsonDocsTabs active="overview" />

<DocOrientation
  eyebrow="The BSON document path"
  title="Use JSON structure without giving up typed values."
  description="BSON keeps the familiar object-and-array model while adding explicit binary representations for values that JSON cannot describe precisely. Its length prefixes also make document traversal straightforward."
  tone="yellow"
  items={[
    {label: 'Structure', value: 'Objects, arrays, field names, types, and values'},
    {label: 'Extra scalars', value: 'Dates, int64, decimal128, bytes, regex, and code'},
    {label: 'Read', value: 'Decode binary documents into JavaScript objects'},
    {label: 'Write', value: 'Serialize JSON-like data as BSON bytes'}
  ]}
/>

<ReferenceBoundary
  title="BSON structure and compatibility"
  description="The reference below covers BSON data types, Extended JSON, binary layout, efficiency trade-offs, and the loaders.gl entry points."
  tone="yellow"
/>

The BSON ("Binary JSON") specification defines a binary format for storing JSON-like data with additional scalar types and explicit type information.

- _[`@loaders.gl/bson`](/docs/modules/bson)_
- _[BSON specification](https://bsonspec.org/)_
- _[Wikipedia article](https://en.wikipedia.org/wiki/BSON)_

## Data Types and Syntax

The topmost element in a BSON structure must be a BSON object. Each object contains one or more elements, where each element has a field name, a type, and a value. Field names are strings.

BSON types include Unicode strings, 32-bit integers, 64-bit integers, doubles, decimal128 values, datetimes, byte arrays, booleans, nulls, nested BSON objects, BSON arrays, JavaScript code, MD5 binary data, and regular expressions.

## EJSON (Extended JSON)

BSON contains types not present in JSON, such as datetimes, byte arrays, and type-specific numeric values. MongoDB's Extended JSON format can represent those BSON values in textual JSON-compatible form.

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
