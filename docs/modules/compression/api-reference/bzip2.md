---
title: bzip2 compressor and decompressor
description: Add asynchronous bzip2 encoding and decoding to loaders.gl format pipelines.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · API reference"
  title="Support bzip2 without making it everyone’s dependency."
  description="The bzip2 codec is an optional, direction-specific backend behind the common loaders.gl compression interface. Install and load it only for formats or datasets that need it."
  tone="violet"
  meta={['bzip2', 'Async codec', 'Incremental batches']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="Runtime behavior"
  title="Use one compression contract with an optional implementation."
  description="Applications and container formats can use the same asynchronous and batched methods while the bzip2 implementation remains a separately loaded compress-utils backend."
  tone="violet"
  items={[
    {label: 'Codec', value: 'bzip2 compressed streams'},
    {label: 'Loading', value: 'Direction-specific backend imports'},
    {label: 'Interface', value: 'Async and incremental batch methods'},
    {label: 'Dependency', value: 'Optional compress-utils peer package'}
  ]}
/>

<ReferenceBoundary
  title="bzip2 implementation details"
  description="The reference below documents imports, backend subpaths, installation, batch behavior, and benchmark guidance."
  tone="violet"
/>

# bzip2 Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`BZip2Compressor` and `BZip2Decompressor` provide asynchronous bzip2 support through direction-
specific `compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```typescript
import {BZip2Compressor, BZip2Decompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs, including
incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice

The currently supported backend is `compress-utils`, available directly as
`bzip2-compressor-compress-utils` and `bzip2-decompressor-compress-utils`. Direct backend imports
are mainly useful for explicit dependency policies and benchmarks.

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured size and throughput.
