# ZstdCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses Zstandard encoded data.

When no `zstd-codec` module is registered, asynchronous `decompress()` and
`decompressBatches()` probe `new DecompressionStream('zstd')` so future runtimes can use native
Zstandard support automatically. Native Zstandard support is not yet widely available.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

Inject `zstd-codec` through `options.modules` for broad compatibility. When it is provided, it
takes precedence over the native stream path. `compress()`, `compressSync()`, and
`decompressSync()` continue to require `zstd-codec` in every runtime.

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`

`options` is optional for future native asynchronous decompression. Supply
`{modules: {'zstd-codec': ZstdCodec}}` for broad runtime compatibility or when a
synchronous/compression API is needed.
