---
title: Snappy compressor and decompressor
description: Use Snappy blocks and frames through the shared loaders.gl compression interface.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · API reference"
  title="Add compact block compression without changing the pipeline."
  description="Snappy implementations fit the common compressor and decompressor contracts, so formats such as Parquet can select a backend without changing the surrounding reader or writer code."
  tone="blue"
  meta={['Snappy blocks', 'Sync one-shot APIs', 'Optional backends']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="What to choose"
  title="Start with the default, specialize only with a reason."
  description="The default JavaScript backend is usually the best balance of size and speed. Alternate decoders are available when a workload benefits from WebAssembly or a specific dependency policy."
  tone="blue"
  items={[
    {label: 'Input', value: 'Snappy-compressed blocks or format payloads'},
    {label: 'Default', value: 'Small snappyjs implementation'},
    {label: 'Alternate', value: 'WebAssembly or compress-utils backend'},
    {label: 'Use it for', value: 'Independent blocks with known output sizes'}
  ]}
/>

<ReferenceBoundary
  title="Snappy implementation details"
  description="The reference below documents imports, backend subpaths, preload behavior, and benchmark guidance."
  tone="blue"
/>

# Snappy Compressor and Decompressor

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`SnappyCompressor` and `SnappyDecompressor` use the compact `snappyjs` implementation. Snappy is
not exposed by the browser stream APIs, so the defaults select the small JavaScript codec directly.

```typescript
import {SnappyCompressor, SnappyDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs and support
synchronous one-shot operation.

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| snappyjs | `snappy-compressor-snappyjs` | `snappy-decompressor-snappyjs` |
| hysnappy | — | `snappy-decompressor-hysnappy` |
| compress-utils | `snappy-compressor-compress-utils` | `snappy-decompressor-compress-utils` |

`SnappyHysnappyDecompressor` uses a small embedded WebAssembly decoder. Its asynchronous
`preload()` method instantiates one decoder per JavaScript realm, after which `decompressSync()` is
available. This can be a better fit for formats such as Parquet that decode many independent blocks
and already know each block's uncompressed size.

The default is normally the best size/performance balance. See the
[live benchmarks](/docs/modules/compression/benchmarks) before pinning another backend.
