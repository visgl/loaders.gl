Compression module · API reference

# Handle LZ4 frames, blocks, and legacy payloads.

LZ4Compressor and LZ4Decompressor preserve the format distinctions that matter while presenting one compact API to applications and container formats.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

Supported layouts

## Pick the layout at the format boundary.

Frame decoding can be selected when the payload carries its own framing. Raw blocks and Hadoop-framed blocks remain available for container formats that provide their own size and metadata.

01

Frames

Self-describing LZ4 frame streams

02

Raw blocks

Caller supplies the expected output size

03

Hadoop

Legacy Hadoop-framed LZ4 blocks

04

Backends

lz4js or compress-utils as needed

Detailed guide

## LZ4 implementation details

The reference below documents imports, supported layouts, backend selection, and measured performance.

# LZ4 Compressor and Decompressor

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`LZ4Compressor` and `LZ4Decompressor` use lazy compress-utils WASM for frames and raw blocks. Legacy Hadoop block framing is parsed in TypeScript. Sync methods require preload. `raw: true` selects raw block encoding; raw decoding requires an output capacity.

```
import {LZ4Compressor, LZ4Decompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs. Raw block decompression may require the expected uncompressed size as the second argument.

## Supported layouts[​](#supported-layouts "Direct link to Supported layouts")

* LZ4 frames
* Raw LZ4 blocks
* Legacy Hadoop-framed LZ4 blocks

## Backend choices[​](#backend-choices "Direct link to Backend choices")

| Backend        | Compressor subpath              | Decompressor subpath              |
| -------------- | ------------------------------- | --------------------------------- |
| lz4js          | `lz4-compressor-lz4js`          | `lz4-decompressor-lz4js`          |
| compress-utils | `lz4-compressor-compress-utils` | `lz4-decompressor-compress-utils` |

See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) for measured frame performance.

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
