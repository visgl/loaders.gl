# SnappyCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`SnappyCompression` is the combined Snappy compatibility codec. Async methods lazily initialize
the compact `snappyjs` implementation. Call `preload()` before a synchronous operation, or inject
`options.modules.snappyjs`.

New code should select a direction-specific adapter from the
[implementation tables](/docs/modules/compression). See the
[live benchmarks](/docs/modules/compression/benchmarks) for measured decoding performance.

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`
