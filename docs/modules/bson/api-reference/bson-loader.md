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
  eyebrow="BSON API · document loader"
  title="Decode typed documents at the application boundary."
  description="BSONLoader parses BSON bytes into JSON-like JavaScript values while preserving the extended scalar types supported by the underlying js-bson implementation."
  tone="yellow"
  meta={['From v3.4', 'Binary documents', 'js-bson wrapper']}
  links={[
    {label: 'BSON format', to: '/docs/modules/bson/formats/bson'},
    {label: 'BSONWriter', to: '/docs/modules/bson/api-reference/bson-writer'},
    {label: 'BSON module', to: '/docs/modules/bson'}
  ]}
/>

<BsonDocsTabs active="bsonloader" />

<DocOrientation
  eyebrow="The decode path"
  title="Read BSON once, then work with ordinary document values."
  description="The loader owns binary parsing and delegates format-specific options to js-bson. Application code receives the decoded document and can decide whether to inspect, transform, or re-encode it."
  tone="yellow"
  items={[
    {label: 'Input', value: 'BSON binary document bytes'},
    {label: 'Output', value: 'JSON-like JavaScript object values'},
    {label: 'Types', value: 'Dates, int64, decimal128, bytes, and nested documents'},
    {label: 'Options', value: 'Forwarded to the underlying js-bson parser'}
  ]}
/>

<ReferenceBoundary
  title="BSONLoader reference"
  description="The sections below document installation, usage, option forwarding, decoded values, and the js-bson attribution boundary."
  tone="yellow"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONLoader` loads BSON binary documents into JSON-like JavaScript objects.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';

const data = await load(url, BSONLoader, {bson: options});
```

## BSONLoader Options

`BSONLoader` currently passes `bson` options through to the underlying MongoDB `js-bson` parser. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution

This loader is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
