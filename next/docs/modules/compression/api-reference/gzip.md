Compression API · GZIP

# Use one GZIP pair for reads and writes.

GZipCompressor and GZipDecompressor provide the normal GZIP path: native streams when available, a lazy compress-utils WASM fallback otherwise, and explicit backend subpaths when an application needs more control.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Built-in codecs](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)

The GZIP path

## Let runtime support decide the fast path.

The library-neutral classes keep application imports stable while selecting a native or fallback implementation. Pin a backend only when bundle size, output, or benchmark reproducibility requires it.

01

Read

GZipDecompressor restores the original bytes

02

Write

GZipCompressor emits GZIP frames

03

Selection

Native stream first, compress-utils fallback

04

Control

useNative and gzip.level options

Detailed guide

## GZIP implementation reference

The sections below document usage, options, backend subpaths, streaming behavior, and benchmark guidance.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`GZipCompressor` and `GZipDecompressor` are the recommended GZIP transforms. Their async methods prefer built-in streams and fall back to `compress-utils`; sync methods require preload and use its WASM codec.

```
import {GZipCompressor, GZipDecompressor} from '@loaders.gl/compression';



const compressed = await new GZipCompressor().compress(data);

const restored = await new GZipDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs.

## Options[​](#options "Direct link to Options")

* `useNative: false` selects the `compress-utils` path.
* `compressUtils.level` selects the fallback compression level.

## Backend choices[​](#backend-choices "Direct link to Backend choices")

Most applications do not need these implementation-specific imports.

| Backend        | Compressor subpath               | Decompressor subpath               |
| -------------- | -------------------------------- | ---------------------------------- |
| fflate         | `gzip-compressor-fflate`         | `gzip-decompressor-fflate`         |
| Pako           | `gzip-compressor-pako`           | `gzip-decompressor-pako`           |
| compress-utils | `gzip-compressor-compress-utils` | `gzip-decompressor-compress-utils` |

Compare their measured size and throughput in the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md).

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
