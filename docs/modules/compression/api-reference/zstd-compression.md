# ZstdCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`ZstdCompression` is the combined Zstandard compatibility codec. Async decoding tries a built-in
stream first and falls back to compact `fzstd`. Encoding and synchronous compatibility operations
use an injected `zstd-codec` module.

For new code, use `ZstdCompressor` or `ZstdDecompressor`. Select `fzstd`, `zstd-codec`, or a
`compress-utils` adapter only when pinning an implementation. See the
[implementation tables](/docs/modules/compression) and
[live benchmarks](/docs/modules/compression/benchmarks).

Inject `zstd-codec` through `options.modules` for compression and decompression through this
codec-backed class. Async-only callers can probe future native Zstandard support through the
lightweight `@loaders.gl/compression/native-decompression` entrypoint without importing
`zstd-codec`.

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

`options` is optional for async decompression. Supply
`{modules: {'zstd-codec': ZstdCodec}}` for compression or synchronous compatibility methods.
`options.zstd.useNative: false` disables built-in stream probing.
