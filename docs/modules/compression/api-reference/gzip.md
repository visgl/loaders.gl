---
title: GZIP Compressor and Decompressor
description: Compress and decompress GZIP payloads through runtime-aware, library-neutral classes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · GZIP"
  title="Use one GZIP pair for reads and writes."
  description="GZipCompressor and GZipDecompressor provide the normal GZIP path: native streams when available, a compact fflate fallback otherwise, and explicit backend subpaths when an application needs more control."
  tone="violet"
  meta={['From v5.0', 'Native stream first', 'fflate fallback']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Built-in codecs', to: '/docs/modules/compression/api-reference/built-in-codecs'}
  ]}
/>

<DocOrientation
  eyebrow="The GZIP path"
  title="Let runtime support decide the fast path."
  description="The library-neutral classes keep application imports stable while selecting a native or fallback implementation. Pin a backend only when bundle size, output, or benchmark reproducibility requires it."
  tone="violet"
  items={[
    {label: 'Read', value: 'GZipDecompressor restores the original bytes'},
    {label: 'Write', value: 'GZipCompressor emits GZIP frames'},
    {label: 'Selection', value: 'Native stream first, fflate fallback'},
    {label: 'Control', value: 'useNative and gzip.level options'}
  ]}
/>

<ReferenceBoundary
  title="GZIP implementation reference"
  description="The sections below document usage, options, backend subpaths, streaming behavior, and benchmark guidance."
  tone="violet"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`GZipCompressor` and `GZipDecompressor` are the recommended GZIP transforms. Their async methods
prefer built-in streams and fall back to compact `fflate`; synchronous and fallback streaming
operations use `fflate` directly.

```typescript
import {GZipCompressor, GZipDecompressor} from '@loaders.gl/compression';

const compressed = await new GZipCompressor().compress(data);
const restored = await new GZipDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` selects the deterministic `fflate` path.
- `gzip.level` selects the fallback compression level.

## Backend choices

Most applications do not need these implementation-specific imports.

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| fflate | `gzip-compressor-fflate` | `gzip-decompressor-fflate` |
| Pako | `gzip-compressor-pako` | `gzip-decompressor-pako` |
| compress-utils | `gzip-compressor-compress-utils` | `gzip-decompressor-compress-utils` |

Compare their measured size and throughput in the [live benchmarks](/docs/modules/compression/benchmarks).
