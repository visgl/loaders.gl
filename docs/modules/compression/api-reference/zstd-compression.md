# ZstdCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses Zstandard encoded data.

Asynchronous `decompress()` and `decompressBatches()` first use
`new DecompressionStream('zstd')` when the runtime accepts that format. In those runtimes,
applications do not need to install or inject `zstd-codec` for async decompression.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

When native Zstandard decompression is unavailable, inject `zstd-codec` through
`options.modules`. `compress()`, `compressSync()`, and `decompressSync()` continue to
require `zstd-codec` in every runtime.

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`

`options` is optional for native asynchronous decompression. Supply
`{modules: {'zstd-codec': ZstdCodec}}` when a fallback codec or synchronous/compression API is
needed.
