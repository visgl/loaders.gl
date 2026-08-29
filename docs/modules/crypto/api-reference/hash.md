---
title: Hash API
description: Hash complete buffers or async binary batches with the crypto module’s portable interface.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Crypto module · API reference"
  title="Hash data without coupling the pipeline to one runtime."
  description="The Hash base class gives synchronous, asynchronous, and batched hashing implementations one shape. Choose the algorithm separately from the code that feeds it bytes."
  tone="violet"
  meta={['Async and sync', 'Batch hashing', 'Browser and Node.js']}
  links={[
    {label: 'Crypto module', to: '/docs/modules/crypto'},
    {label: 'CRC32Hash', to: '/docs/modules/crypto/api-reference/crc32-hash'},
    {label: 'SHA256Hash', to: '/docs/modules/crypto/api-reference/sha256-hash'}
  ]}
/>

<DocOrientation
  eyebrow="Choose the operation"
  title="Keep hashing at the same boundary as the bytes."
  description="Use hash() for a complete buffer, hashSync() when the implementation is already loaded, and hashBatches() when data arrives through a streaming pipeline."
  tone="violet"
  items={[
    {label: 'Algorithm', value: 'Select a concrete Hash implementation'},
    {label: 'Async', value: 'Hash one ArrayBuffer without blocking the caller'},
    {label: 'Sync', value: 'Use a preloaded implementation for local work'},
    {label: 'Batches', value: 'Hash an AsyncIterable of binary chunks'}
  ]}
/>

<ReferenceBoundary
  title="Hash API details"
  description="The reference below documents support detection, preload requirements, output encodings, and the fallback behavior for non-streaming algorithms."
  tone="violet"
/>

# Hash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

`Hash` is the abstract base class for loaders.gl hash classes.

## Fields

#### `name`: string

The name of the hash algorithm

#### `isSupported`: boolean

## Methods

#### `preload()`

`preload(): Promise<void>`

Asynchronously loads required libraries. For some hash classes this must be completed before
`hashSync()` is available.

#### `hash()`

```typescript
  hash.hash(data: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<ArrayBuffer>
```

Asynchronously hashes data.

#### `hashSync()`

```typescript
  hash.hashSync(data: ArrayBuffer, encoding: 'hex' | 'base64'): ArrayBuffer
```

Synchronously hashes data.

:::caution
For some hash sub classes, `preload()` must have been called and completed before
synchronous operations are available.
:::

#### `hashInBactches()`

```typescript
  hash.hashBatches(data: AsyncIterable<ArrayBuffer>, encoding: 'hex' | 'base64'): AsyncIterable<ArrayBuffer>
```

Asynchronously hashes data in batches.

If the underlying hashion does not support streaming hashion,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single hashed batch will be yielded.
