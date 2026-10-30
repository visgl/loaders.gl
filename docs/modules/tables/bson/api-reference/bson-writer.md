---
title: BSONWriter
description: Encode JSON-like JavaScript objects as BSON binary documents.
hide_title: true
page_style: designed
---

import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="bson"
  eyebrow="BSON API · document writer"
  title="Put typed document values back on the wire."
  description="BSONWriter serializes JSON-like JavaScript objects into BSON bytes, including explicitly typed native BSON scalar values."
  tone="yellow"
  meta={['From v3.4', 'Binary output', 'Native codec']}
  links={[
    {label: 'BSON format', to: '/docs/modules/tables/bson/formats/bson'},
    {label: 'BSONLoader', to: '/docs/modules/tables/bson/api-reference/bson-loader'},
    {label: 'BSON module', to: '/docs/modules/tables/bson'}
  ]}
/>

<BsonDocsTabs active="bsonwriter" />

<DocOrientation
  eyebrow="The encode path"
  title="Serialize a document without flattening its richer scalar types."
  description="Pass ordinary object structures and BSON-aware values to the writer. It encodes BSON directly without an external backend."
  tone="yellow"
  items={[
    {label: 'Input', value: 'JSON-like JavaScript objects and nested values'},
    {label: 'Output', value: 'ArrayBuffer containing one BSON document'},
    {label: 'Types', value: 'Extended BSON scalar values remain available'},
    {label: 'Options', value: 'Native encode and nesting options'}
  ]}
/>

<ReferenceBoundary
  title="BSONWriter reference"
  description="The sections below document installation, usage, native options and encoded value representations."
  tone="yellow"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONWriter` writes JSON-like JavaScript objects as BSON binary documents.

## Installation

BSON decoding and encoding are implemented natively; no `bson` package is needed.

```bash
npm install @loaders.gl/core @loaders.gl/tables
```

Install the `@loaders.gl/tables` package; `/bson` is an import subpath, not a separate package.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {BSONWriter} from '@loaders.gl/tables/bson';

const arrayBuffer = await encode(data, BSONWriter);
```

## BSONWriter Options

| Option | Default | Behavior |
| --- | --- | --- |
| `bson.ignoreUndefined` | `true` | Omit undefined object properties. Set false to encode them as null. Undefined and sparse array slots always encode as null. |
| `bson.maxDepth` | `100` | Maximum document/array nesting, including the root and code scopes. |

Both async `encode()` and `encodeSync()` honor these options. Cycles, invalid dates,
int64 values outside their representable range, unsupported objects, and field names
containing null characters are rejected. Regular expressions must use BSON-supported
flags (`i`, `l`, `m`, `s`, `u`, `x`); use a native scalar marker for BSON-only regex flags.
Use an explicit `undefined` BSON marker to write the deprecated BSON undefined type.

## Value representations

See the [native BSON value contract](/docs/modules/tables/bson#native-value-representations).
