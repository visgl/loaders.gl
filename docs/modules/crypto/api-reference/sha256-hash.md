---
title: SHA256Hash
description: Calculate SHA-256 digests through the loaders.gl asynchronous and streaming hash interface.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Crypto module · hash implementation"
  title="Add a modern digest at the bytes boundary."
  description="SHA256Hash implements the shared Hash API for content addressing, integrity metadata, and compatibility with systems that specify SHA-256."
  tone="violet"
  meta={['SHA-256', 'Async and sync', 'Streaming support']}
  links={[
    {label: 'Hash API', to: '/docs/modules/crypto/api-reference/hash'},
    {label: 'Crypto module', to: '/docs/modules/crypto'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Use it for integrity"
  title="Hash complete content or feed it incrementally."
  description="Use the asynchronous method for a complete buffer, the synchronous method after preload, or the batch method when a source already produces an async iterable of bytes."
  tone="violet"
  items={[
    {label: 'Input', value: 'ArrayBuffer or async binary batches'},
    {label: 'Output', value: 'SHA-256 digest in the selected encoding'},
    {label: 'Runtime', value: 'Browser and Node.js through the shared API'},
    {label: 'Security', value: 'Digest integrity, not a password hash'}
  ]}
/>

<ReferenceBoundary
  title="SHA256Hash details"
  description="The reference below documents the constructor, preload requirements, and streaming behavior."
  tone="violet"
/>

# SHA256Hash

<p className="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Calculates the SHA256 hash.

## Interface

Implements the [`Hash`](./hash) API.

## Methods

### `constructor(options?: object)`

## Remarks

- This transform supports streaming hashing.
