# XZCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`XZCompression` is the combined XZ/LZMA compatibility codec. It dynamically imports the requested
`compress-utils` direction, so encoding code is not initialized by a decode-only call.

New code should import `XZCompressUtilsCompressor` or `XZCompressUtilsDecompressor` from the
direction-specific subpath listed in the [implementation tables](/docs/modules/compression).

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

Creates an XZ/LZMA compatibility codec. Install the optional `compress-utils` peer dependency
before calling it.

### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses XZ data.

### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously compresses XZ data.

The direction-specific adapters also expose incremental operation. See the
[live benchmarks](/docs/modules/compression/benchmarks) for focused bundle size and decoding
throughput.
