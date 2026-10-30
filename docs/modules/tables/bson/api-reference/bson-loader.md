---
title: BSONLoader
description: Decode BSON binary documents into JSON-like JavaScript objects.
hide_title: true
page_style: designed
---

import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="bson"
  eyebrow="BSON API · document loader"
  title="Decode typed documents at the application boundary."
  description="BSONLoader parses BSON bytes into JSON-like JavaScript values with lossless representations for BSON-specific scalar types."
  tone="yellow"
  meta={['From v3.4', 'Binary documents', 'Native codec']}
  links={[
    {label: 'BSON format', to: '/docs/modules/tables/bson/formats/bson'},
    {label: 'BSONWriter', to: '/docs/modules/tables/bson/api-reference/bson-writer'},
    {label: 'BSON module', to: '/docs/modules/tables/bson'}
  ]}
/>

<BsonDocsTabs active="bsonloader" />

<DocOrientation
  eyebrow="The decode path"
  title="Read BSON once, then work with ordinary document values."
  description="The loader decodes BSON directly without an external backend. Application code receives the decoded document and can decide whether to inspect, transform, or re-encode it."
  tone="yellow"
  items={[
    {label: 'Input', value: 'BSON binary document bytes'},
    {label: 'Output', value: 'JSON-like JavaScript object values'},
    {label: 'Types', value: 'Dates, int64, decimal128, bytes, and nested documents'},
    {label: 'Options', value: 'Native decode and nesting options'}
  ]}
/>

<ReferenceBoundary
  title="BSONLoader reference"
  description="The sections below document installation, usage, native options and decoded value representations."
  tone="yellow"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONLoader` loads BSON binary documents into JSON-like JavaScript objects.

## Installation

BSON decoding and encoding are implemented natively; no `bson` package is needed.

```bash
npm install @loaders.gl/core @loaders.gl/documents
```

Install `@loaders.gl/documents`. Its root contains metadata; use flat subpaths for implementations.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/documents';

const data = await load(url, BSONLoader, {bson: options});
```

## BSONLoader Options

| Option | Default | Behavior |
| --- | --- | --- |
| `bson.concatenatedDocuments` | `'error'` | Reject concatenated dump documents, or use `'first'` to decode only the first. |
| `bson.promoteLongs` | `true` | Return safe int64 values as numbers; unsafe values remain bigint. Set false for tagged int64 values. |
| `bson.useBigInt64` | `false` | Return int64 values as bigint, overriding `promoteLongs`. |
| `bson.preserveTypes` | `false` | Preserve double, int32, and int64 wire types using native scalar markers; takes precedence over integer promotion. |
| `bson.maxDepth` | `100` | Maximum document/array nesting, including the root and JavaScript code scopes. |

Strings are strictly validated as UTF-8. Invalid lengths, terminators, array indexes, boolean
values, unknown element types, and reads outside nested document boundaries are rejected.
Duplicate document keys use the last value. Prototype-sensitive keys remain ordinary own
properties and never modify object prototypes. Stored code and regex patterns are not executed.

## Value representations

See the [native BSON value contract](/docs/modules/tables/bson#native-value-representations).

For synchronous parsing, import `BSONLoaderWithParser` from
`@loaders.gl/documents/bson-loader` and pass it to `parseSync`.
