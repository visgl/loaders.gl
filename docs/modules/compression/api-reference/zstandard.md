---
title: Zstandard Compressor and Decompressor
description: Use Zstandard compression with lazy WASM and compact JavaScript fallbacks.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · Zstandard"
  title="Keep the large codec out of the common path."
  description="ZstdCompressor and ZstdDecompressor probe native streams first and load a larger or specialized implementation only when the runtime or application needs it."
  tone="violet"
  meta={['From v5.0', 'Lazy codec loading', 'Native and WASM options']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Built-in codecs', to: '/docs/modules/compression/api-reference/built-in-codecs'}
  ]}
/>

<DocOrientation
  eyebrow="The Zstandard path"
  title="Pay for the codec only when the data needs it."
  description="Zstandard offers strong compression, but its best implementations can be sizeable. The default classes keep that cost lazy and leave an explicit injection point for applications that already manage a WASM or native backend."
  tone="violet"
  items={[
    {label: 'Compression', value: 'Native stream, then lazy compress-utils'},
    {label: 'Decompression', value: 'Native stream, then compact fzstd'},
    {label: 'Optional backend', value: 'Inject zstd-codec when needed'},
    {label: 'Lifecycle', value: 'Preload before synchronous specialized methods'}
  ]}
/>

<ReferenceBoundary
  title="Zstandard implementation reference"
  description="The sections below document usage, lazy loading, options, backend choices, and preload requirements."
  tone="violet"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`ZstdCompressor` and `ZstdDecompressor` keep the large WASM codec out of the normal decode path.
They try built-in streams first. Compression falls back to lazy `compress-utils`; decompression
falls back to compact synchronous `fzstd`.

```typescript
import {ZstdCompressor, ZstdDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` disables built-in probing.
- `modules['zstd-codec']` injects the optional high-throughput/WASM implementation. Call
  `preload()` before its synchronous methods.

## Backend choices

| Backend | Direction | Subpath |
| --- | --- | --- |
| fzstd | Decompression | `zstd-decompressor-fzstd` |
| zstd-codec | Compression and decompression compatibility | `zstd-zstd-codec` |
| compress-utils | Compression | `zstd-compressor-compress-utils` |
| compress-utils | Decompression | `zstd-decompressor-compress-utils` |

See the [live benchmarks](/docs/modules/compression/benchmarks) for bundle-size and throughput comparisons, plus the status of built-in browser support.
