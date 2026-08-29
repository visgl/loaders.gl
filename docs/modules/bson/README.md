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
  eyebrow="BSON module"
  title="Keep JSON-like documents in a binary form."
  description="`@loaders.gl/bson` loads and writes BSON documents as JavaScript objects. It is useful when a binary document format is required but the application wants the familiar JSON data model."
  tone="yellow"
  meta={['BSON documents', 'Loader and writer', 'JSON-like objects']}
  links={[
    {label: 'BSON format', to: '/docs/modules/bson/formats/bson'},
    {label: 'BSON loader', to: '/docs/modules/bson/api-reference/bson-loader'},
    {label: 'BSON writer', to: '/docs/modules/bson/api-reference/bson-writer'}
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
  description="The reference below covers installation, entry points, supported data representation, and the upstream js-bson implementation."
  tone="yellow"
/>

![bson-logo](../../images/logos/bson-logo.png)

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

The `@loaders.gl/bson` module provides support for the [BSON](/docs/modules/bson/formats/bson) format.
The BSON format stores arbitrary (loosely structured) data largely equivalent to the textual JSON format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/bson
```

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`BSONLoader`](/docs/modules/bson/api-reference/bson-loader) | Loads BSON binary documents into JSON-like JavaScript objects. |
| [`BSONWriter`](/docs/modules/bson/api-reference/bson-writer) | Writes JSON-like JavaScript objects as BSON binary documents. |

## Attribution

This module is a wrapper around MongoDB [js-bson](https://github.com/mongodb/js-bson) module, which is under Apache 2.0 license.
