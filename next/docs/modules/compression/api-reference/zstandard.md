Compression API · Zstandard

# Keep the large codec out of the common path.

ZstdCompressor and ZstdDecompressor probe native streams first and load a larger or specialized implementation only when the runtime or application needs it.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Built-in codecs](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)

The Zstandard path

## Pay for the codec only when the data needs it.

Zstandard offers strong compression, but its best implementations can be sizeable. The default classes keep that cost lazy and leave an explicit injection point for applications that already manage a WASM or native backend.

01

Compression

Native stream, then lazy compress-utils

02

Decompression

Native stream, then compact fzstd

03

Optional backend

Inject zstd-codec when needed

04

Lifecycle

Preload before synchronous specialized methods

Detailed guide

## Zstandard implementation reference

The sections below document usage, lazy loading, options, backend choices, and preload requirements.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`ZstdCompressor` and `ZstdDecompressor` keep the large WASM codec out of the normal decode path. They try built-in streams first. Compression falls back to lazy `compress-utils`; decompression falls back to its decoder-only WASM codec.

```
import {ZstdCompressor, ZstdDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs.

## Options[​](#options "Direct link to Options")

* `useNative: false` disables built-in probing.
* `compressUtils.level` configures the WASM encoder. Call `preload()` before sync methods.
* Use the explicit zstd-codec subpath for legacy module injection.

## Backend choices[​](#backend-choices "Direct link to Backend choices")

| Backend        | Direction                                   | Subpath                            |
| -------------- | ------------------------------------------- | ---------------------------------- |
| fzstd          | Decompression                               | `zstd-decompressor-fzstd`          |
| zstd-codec     | Compression and decompression compatibility | `zstd-zstd-codec`                  |
| compress-utils | Compression                                 | `zstd-compressor-compress-utils`   |
| compress-utils | Decompression                               | `zstd-decompressor-compress-utils` |

See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) for bundle-size and throughput comparisons, plus the status of built-in browser support.

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
