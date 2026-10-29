Compression module · API reference

# Support bzip2 without making it everyone’s dependency.

The bzip2 codec is an optional, direction-specific backend behind the common loaders.gl compression interface. Install and load it only for formats or datasets that need it.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

Runtime behavior

## Use one compression contract with an optional implementation.

Applications and container formats can use the same asynchronous and batched methods while the bzip2 implementation remains a separately loaded compress-utils backend.

01

Codec

bzip2 compressed streams

02

Loading

Direction-specific backend imports

03

Interface

Async and incremental batch methods

04

Dependency

Optional compress-utils peer package

Detailed guide

## bzip2 implementation details

The reference below documents imports, backend subpaths, installation, batch behavior, and benchmark guidance.

# bzip2 Compressor and Decompressor

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`BZip2Compressor` and `BZip2Decompressor` provide asynchronous bzip2 support through direction- specific `compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```
import {BZip2Compressor, BZip2Decompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs, including incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice[​](#backend-choice "Direct link to Backend choice")

The currently supported backend is `compress-utils`, available directly as `bzip2-compressor-compress-utils` and `bzip2-decompressor-compress-utils`. Direct backend imports are mainly useful for explicit dependency policies and benchmarks.

See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) for measured size and throughput.
