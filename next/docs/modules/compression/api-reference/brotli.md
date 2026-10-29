Compression API · Brotli

# Use Brotli without bundling every implementation.

BrotliCompressor and BrotliDecompressor try the runtime’s native stream first, then load only the fallback implementation required by the current operation.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

The Brotli path

## Keep the browser capability check at the codec boundary.

Applications use one stable class while the runtime decides whether a native stream or a lazy fallback is available. Explicit options remain available for Node.js and specialized deployments.

01

Selection

Built-in stream when available

02

Compression fallback

Lazy compress-utils implementation

03

Decompression fallback

Lazy compress-utils decoder

04

Control

useNative, modules.brotli, and brotli.useZlib

Detailed guide

## Brotli implementation reference

The sections below document usage, options, fallback loading, backend choices, and runtime-dependent support.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`BrotliCompressor` and `BrotliDecompressor` provide the balanced Brotli policy. Both try a built-in stream first. Compression then lazily loads `compress-utils`; decompression lazily loads its decoder-only WASM codec. Nothing is loaded for a fallback that is not used.

```
import {BrotliCompressor, BrotliDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs.

## Options[​](#options "Direct link to Options")

* `useNative: false` skips built-in stream probing.
* `compressUtils.level` selects the WASM encoder level.
* Sync calls require a completed preload. Legacy injected/Node zlib options remain on explicit compatibility subpaths.

## Backend choices[​](#backend-choices "Direct link to Backend choices")

| Backend                 | Direction     | Subpath                              |
| ----------------------- | ------------- | ------------------------------------ |
| loaders.gl decoder shim | Decompression | `brotli-decompressor-shim`           |
| compress-utils          | Compression   | `brotli-compressor-compress-utils`   |
| compress-utils          | Decompression | `brotli-decompressor-compress-utils` |

Built-in Brotli availability is runtime-dependent. The [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) show what the current browser supports.

Under Node.js, built-in streams and `brotli.useZlib` use Node’s Brotli decoder. Use the latest patch release; see the [October 2026 Node.js security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
