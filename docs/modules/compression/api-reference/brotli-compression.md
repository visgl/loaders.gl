# BrotliCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`BrotliCompression` is the combined Brotli compatibility codec. Async operations try the
runtime's built-in stream first. Decompression lazily loads the loaders.gl JavaScript decoder when
built-in Brotli is unavailable; compression requires built-in support, Node `zlib`, or an injected
encoder.

For new code, choose `BrotliLoadersGLDecompressor` for compact decoding or a direction-specific
`compress-utils` adapter. See the [implementation table](/docs/modules/compression) and
[live benchmarks](/docs/modules/compression/benchmarks).

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

`options.brotli.useZlib` enables Node's built-in `zlib` implementation. `options.modules.brotli`
can supply an application-selected encoder and decoder.
