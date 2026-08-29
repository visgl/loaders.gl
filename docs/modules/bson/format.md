---
title: BSON format
description: Load and write JSON-like documents in a compact binary representation with explicit BSON type support.
hide_title: true
page_style: designed
---

import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Binary document format"
  title="Keep document semantics in a binary envelope."
  description="BSON stores JSON-like documents with binary encodings for values such as dates, integers, and byte arrays. The module exposes a focused load/write path while keeping the result familiar to JavaScript applications."
  tone="yellow"
  meta={['Binary documents', 'JSON-like result', 'Load and write']}
  links={[
    {label: 'BSON module', to: '/docs/modules/bson'},
    {label: 'BSONLoader', to: '/docs/modules/bson/api-reference/bson-loader'},
    {label: 'BSONWriter', to: '/docs/modules/bson/api-reference/bson-writer'}
  ]}
/>

<BsonDocsTabs active="format" />

<DocOrientation
  eyebrow="Document data path"
  title="Use a binary document without changing the application model."
  description="BSON is useful when a document needs typed binary values or compact transport. loaders.gl decodes it into JSON-like objects and writes compatible objects back to the binary format."
  tone="yellow"
  items={[
    {label: 'Read', value: 'Decode BSON elements into JSON-like JavaScript values.'},
    {label: 'Types', value: 'Preserve format-specific binary, numeric, and date values.'},
    {label: 'Use', value: 'Pass the document to ordinary application logic.'},
    {label: 'Write', value: 'Encode JSON-like values as BSON binary documents.'}
  ]}
/>

<ReferenceBoundary
  title="BSON format and API details"
  description="The reference below lists the document shape, supported value types, loader options, and writer behavior."
  tone="yellow"
/>

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/bson/api-reference/bson-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>BSONLoader</strong>
    <span>Loads BSON binary documents into JSON-like JavaScript objects.</span>
    <span className="docs-api-card__meta">Output: Record&lt;string, unknown&gt;</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/bson/api-reference/bson-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>BSONWriter</strong>
    <span>Writes JSON-like JavaScript objects as BSON binary documents.</span>
    <span className="docs-api-card__meta">Input: Record&lt;string, unknown&gt;</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

| Characteristic | Value                                          |
| -------------- | ---------------------------------------------- |
| File Format    | [BSON](https://bsonspec.org/)                  |
| Data Format    | [Unstructured/JSON](/docs/specifications/category-json) |
| File Type      | Binary                                         |
| File Extension | `.bson`                                        |
| MIME Types     | `application/bson`                             |
