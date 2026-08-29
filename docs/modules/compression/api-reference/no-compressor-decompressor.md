---
title: NoCompressor and NoDecompressor
description: Represent an uncompressed payload through the same compressor and decompressor contract.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · API reference"
  title="Keep uncompressed formats on the same pipeline path."
  description="NoCompressor and NoDecompressor are identity transforms. They let a format select compression at runtime without adding a special branch for the uncompressed case."
  tone="yellow"
  meta={['Identity transform', 'Sync and async', 'v5 compatibility']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Compression formats', to: '/docs/modules/compression'}
  ]}
/>

<DocOrientation
  eyebrow="The pass-through case"
  title="Select no compression without changing the caller."
  description="The identity implementations preserve input bytes and expose the same method names as real codecs, which keeps format code declarative and easy to test."
  tone="yellow"
  items={[
    {label: 'Compress', value: 'Returns the input unchanged'},
    {label: 'Decompress', value: 'Returns the input unchanged'},
    {label: 'Methods', value: 'Async and synchronous operations'},
    {label: 'Migration', value: 'Deprecated NoCompression remains for v5 compatibility'}
  ]}
/>

<ReferenceBoundary
  title="Pass-through implementation details"
  description="The reference below documents the identity behavior, available methods, shared interface, and v5 migration note."
  tone="yellow"
/>

# NoCompressor and NoDecompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`NoCompressor` and `NoDecompressor` are pass-through transforms. They let a pipeline represent an
uncompressed format without a special branch.

```typescript
import {NoCompressor, NoDecompressor} from '@loaders.gl/compression';
```

`compress()`, `compressSync()`, `decompress()`, and `decompressSync()` return the input unchanged.
The classes implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

The deprecated combined `NoCompression` class remains available for v5 migration.
