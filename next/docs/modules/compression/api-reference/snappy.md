Compression module · API reference

# Add compact block compression without changing the pipeline.

Snappy implementations fit the common compressor and decompressor contracts, so formats such as Parquet can select a backend without changing the surrounding reader or writer code.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

What to choose

## Start with the default, specialize only with a reason.

The default uses direction-specific compress-utils WASM modules. Alternate backends remain available for reference and comparison.

01

Input

Snappy-compressed blocks or format payloads

02

Default

Small snappyjs implementation

03

Alternate

WebAssembly or compress-utils backend

04

Use it for

Independent blocks with known output sizes

Detailed guide

## Snappy implementation details

The reference below documents imports, backend subpaths, preload behavior, and benchmark guidance.

# Snappy Compressor and Decompressor

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`SnappyCompressor` and `SnappyDecompressor` use the `compress-utils` WASM implementation. Snappy is not exposed by the browser stream APIs, so the defaults load the required codec direction dynamically.

```
import {SnappyCompressor, SnappyDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs and support synchronous one-shot operation after preload.

## Backend choices[​](#backend-choices "Direct link to Backend choices")

| Backend        | Compressor subpath                 | Decompressor subpath                 |
| -------------- | ---------------------------------- | ------------------------------------ |
| snappyjs       | `snappy-compressor-snappyjs`       | `snappy-decompressor-snappyjs`       |
| hysnappy       | —                                  | `snappy-decompressor-hysnappy`       |
| compress-utils | `snappy-compressor-compress-utils` | `snappy-decompressor-compress-utils` |

`SnappyHysnappyDecompressor` uses a small embedded WebAssembly decoder. Its asynchronous `preload()` method instantiates one decoder per JavaScript realm, after which `decompressSync()` is available. This can be a better fit for formats such as Parquet that decode many independent blocks and already know each block's uncompressed size.

The default is normally the best size/performance balance. See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) before pinning another backend.

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
