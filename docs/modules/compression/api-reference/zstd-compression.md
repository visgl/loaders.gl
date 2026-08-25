# ZstdCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses Zstandard encoded data.

See the [compression benchmarks](/docs/modules/compression/benchmarks) for built-in and fallback decompression comparisons.

Inject `zstd-codec` through `options.modules` for compression and decompression through this
codec-backed class. Async-only callers can probe future native Zstandard support through the
lightweight `@loaders.gl/compression/native-decompression` entrypoint without importing
`zstd-codec`.

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`

`options` is optional at construction time. Supply `{modules: {'zstd-codec': ZstdCodec}}` before
calling compression or decompression methods.
