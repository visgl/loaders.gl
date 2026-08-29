---
title: DEFLATE Compressor and Decompressor
description: Handle wrapped and raw DEFLATE payloads with the shared compression interfaces.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · DEFLATE"
  title="Keep wrapped and raw DEFLATE distinct."
  description="DeflateCompressor and DeflateDecompressor expose the common DEFLATE path while making the RFC 1950 wrapper and raw RFC 1951 stream an explicit option."
  tone="violet"
  meta={['From v5.0', 'Wrapped or raw', 'Native and fflate paths']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Live benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="The DEFLATE path"
  title="Choose the envelope your receiving format expects."
  description="Default DEFLATE is wrapped. Set raw when the surrounding format carries its own framing, and keep the same compressor/decompressor API around either representation."
  tone="violet"
  items={[
    {label: 'Default', value: 'Wrapped DEFLATE stream'},
    {label: 'Raw mode', value: 'raw: true for RFC 1951 blocks'},
    {label: 'Selection', value: 'Native stream where supported, fflate fallback'},
    {label: 'Control', value: 'useNative and deflate.level options'}
  ]}
/>

<ReferenceBoundary
  title="DEFLATE implementation reference"
  description="The sections below document wrapped and raw modes, options, backend choices, and compatibility guidance."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`DeflateCompressor` and `DeflateDecompressor` are the recommended DEFLATE transforms. Async methods
prefer built-in streams and fall back to `fflate`. Wrapped zlib DEFLATE and raw RFC 1951 DEFLATE
remain distinct and interoperable.

```typescript
import {DeflateCompressor, DeflateDecompressor} from '@loaders.gl/compression';

const compressed = await new DeflateCompressor().compress(data);
const restored = await new DeflateDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `raw: true` selects raw DEFLATE. Raw compression uses `fflate`; raw decompression may use a
  built-in `deflate-raw` stream when available.
- `useNative: false` disables built-in probing.
- `deflate.level` selects the fallback compression level.

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| fflate | `deflate-compressor-fflate` | `deflate-decompressor-fflate` |
| Pako | `deflate-compressor-pako` | `deflate-decompressor-pako` |
| compress-utils | `deflate-compressor-compress-utils` | `deflate-decompressor-compress-utils` |

Most applications should stay with the defaults. See the [live benchmarks](/docs/modules/compression/benchmarks) when deliberately choosing a backend.
