---
title: XZ compressor and decompressor
description: Add asynchronous XZ and LZMA compression to loaders.gl pipelines.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · API reference"
  title="Use XZ and LZMA where the format requires it."
  description="The XZ codec is loaded on demand through compress-utils, keeping the default bundle small while retaining the shared asynchronous and batched compression interface."
  tone="orange"
  meta={['XZ and LZMA', 'Async codec', 'Lazy backend loading']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="Runtime behavior"
  title="Keep the optional codec at the edge of the bundle."
  description="Install the optional compress-utils dependency when an application needs XZ. The encoder and decoder load only when the corresponding operation runs."
  tone="orange"
  items={[
    {label: 'Codec', value: 'XZ container with LZMA compression'},
    {label: 'Loading', value: 'Direction-specific dynamic backend'},
    {label: 'Interface', value: 'Async and incremental batch methods'},
    {label: 'Dependency', value: 'Optional compress-utils peer package'}
  ]}
/>

<ReferenceBoundary
  title="XZ implementation details"
  description="The reference below documents imports, backend subpaths, installation, batch behavior, and benchmark guidance."
  tone="orange"
/>

# XZ Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`XZCompressor` and `XZDecompressor` provide asynchronous XZ/LZMA support through direction-specific
`compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```typescript
import {XZCompressor, XZDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs, including
incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice

The currently supported backend is `compress-utils`, available directly as
`xz-compressor-compress-utils` and `xz-decompressor-compress-utils`. Most applications should use
the library-neutral defaults.

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured size and throughput.
