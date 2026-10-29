Compression module · API reference

# Use XZ and LZMA where the format requires it.

The XZ codec is loaded on demand through compress-utils, keeping the default bundle small while retaining the shared asynchronous and batched compression interface.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

Runtime behavior

## Keep the optional codec at the edge of the bundle.

Install the optional compress-utils dependency when an application needs XZ. The encoder and decoder load only when the corresponding operation runs.

01

Codec

XZ container with LZMA compression

02

Loading

Direction-specific dynamic backend

03

Interface

Async and incremental batch methods

04

Dependency

Optional compress-utils peer package

Detailed guide

## XZ implementation details

The reference below documents imports, backend subpaths, installation, batch behavior, and benchmark guidance.

# XZ Compressor and Decompressor

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`XZCompressor` and `XZDecompressor` provide asynchronous XZ/LZMA support through direction-specific `compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```
import {XZCompressor, XZDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs, including incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice[​](#backend-choice "Direct link to Backend choice")

The currently supported backend is `compress-utils`, available directly as `xz-compressor-compress-utils` and `xz-decompressor-compress-utils`. Most applications should use the library-neutral defaults.

See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) for measured size and throughput.
