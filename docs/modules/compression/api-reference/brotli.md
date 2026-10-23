---
title: Brotli Compressor and Decompressor
description: Compress and decompress Brotli payloads with native-stream probing and lazy fallbacks.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · Brotli"
  title="Use Brotli without bundling every implementation."
  description="BrotliCompressor and BrotliDecompressor try the runtime’s native stream first, then load only the fallback implementation required by the current operation."
  tone="violet"
  meta={['From v5.0', 'Native stream first', 'Lazy fallback loading']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Live benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="The Brotli path"
  title="Keep the browser capability check at the codec boundary."
  description="Applications use one stable class while the runtime decides whether a native stream or a lazy fallback is available. Explicit options remain available for Node.js and specialized deployments."
  tone="violet"
  items={[
    {label: 'Selection', value: 'Built-in stream when available'},
    {label: 'Compression fallback', value: 'Lazy compress-utils implementation'},
    {label: 'Decompression fallback', value: 'Lazy compress-utils decoder'},
    {label: 'Control', value: 'useNative, modules.brotli, and brotli.useZlib'}
  ]}
/>

<ReferenceBoundary
  title="Brotli implementation reference"
  description="The sections below document usage, options, fallback loading, backend choices, and runtime-dependent support."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`BrotliCompressor` and `BrotliDecompressor` provide the balanced Brotli policy. Both try a built-in
stream first. Compression then lazily loads `compress-utils`; decompression lazily loads its decoder-only WASM codec. Nothing is loaded for a fallback that is not used.

```typescript
import {BrotliCompressor, BrotliDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` skips built-in stream probing.
- `compressUtils.level` selects the WASM encoder level.
- Sync calls require a completed preload. Legacy injected/Node zlib options remain on explicit compatibility subpaths.

## Backend choices

| Backend | Direction | Subpath |
| --- | --- | --- |
| loaders.gl decoder shim | Decompression | `brotli-decompressor-shim` |
| compress-utils | Compression | `brotli-compressor-compress-utils` |
| compress-utils | Decompression | `brotli-decompressor-compress-utils` |

Built-in Brotli availability is runtime-dependent. The [live benchmarks](/docs/modules/compression/benchmarks) show what the current browser supports.

Under Node.js, the built-in stream and the `brotli.useZlib` option both use the Brotli decoder bundled with Node.js. When decompressing untrusted data, use the latest patch release of a [supported Node.js version](/docs/developer-guide/node#supported-nodejs-versions).

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
