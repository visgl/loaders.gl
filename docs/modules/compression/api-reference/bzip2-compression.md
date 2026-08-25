# BZip2Compression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`BZip2Compression` is the combined bzip2 compatibility codec. It dynamically imports the
requested `compress-utils` direction, so encoding code is not initialized by a decode-only call.

New code should import `BZip2Compressor` or `BZip2Decompressor`. These defaults currently use
the lazy `compress-utils` implementation.

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

Creates a bzip2 compatibility codec. Install the optional `compress-utils` peer dependency before
calling it.

### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses bzip2 data.

### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously compresses bzip2 data.

The direction-specific adapters also expose incremental operation. See the
[live benchmarks](/docs/modules/compression/benchmarks) for focused bundle size and decoding
throughput.
