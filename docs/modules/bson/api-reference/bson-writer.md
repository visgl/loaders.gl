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
  eyebrow="BSON API · document writer"
  title="Put typed document values back on the wire."
  description="BSONWriter serializes JSON-like JavaScript objects into BSON bytes, including the extended scalar values supported by the underlying js-bson implementation."
  tone="yellow"
  meta={['From v3.4', 'Binary output', 'js-bson wrapper']}
  links={[
    {label: 'BSON format', to: '/docs/modules/bson/formats/bson'},
    {label: 'BSONLoader', to: '/docs/modules/bson/api-reference/bson-loader'},
    {label: 'BSON module', to: '/docs/modules/bson'}
  ]}
/>

<BsonDocsTabs active="bsonwriter" />

<DocOrientation
  eyebrow="The encode path"
  title="Serialize a document without flattening its richer scalar types."
  description="Pass ordinary object structures and BSON-aware values to the writer. It delegates serialization details to js-bson while keeping the loaders.gl encode API consistent with other writers."
  tone="yellow"
  items={[
    {label: 'Input', value: 'JSON-like JavaScript objects and nested values'},
    {label: 'Output', value: 'ArrayBuffer containing one BSON document'},
    {label: 'Types', value: 'Extended BSON scalar values remain available'},
    {label: 'Options', value: 'Forwarded to the underlying js-bson serializer'}
  ]}
/>

<ReferenceBoundary
  title="BSONWriter reference"
  description="The sections below document installation, usage, option forwarding, output bytes, and the js-bson attribution boundary."
  tone="yellow"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONWriter` writes JSON-like JavaScript objects as BSON binary documents.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {BSONWriter} from '@loaders.gl/bson';

const arrayBuffer = await encode(data, BSONWriter);
```

## BSONWriter Options

`BSONWriter` currently passes `bson` options through to the underlying MongoDB `js-bson` serializer. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution

This writer is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
