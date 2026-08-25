# SnappyCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`SnappyCompression` is the combined Snappy compatibility codec. Async methods lazily initialize
the compact `snappyjs` implementation. Call `preload()` before a synchronous operation, or inject
`options.modules.snappyjs`.

New code should use `SnappyCompressor` or `SnappyDecompressor`. Select a specific adapter only
when pinning an implementation. See the [implementation tables](/docs/modules/compression) and
[live benchmarks](/docs/modules/compression/benchmarks) for measured decoding performance.

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`
