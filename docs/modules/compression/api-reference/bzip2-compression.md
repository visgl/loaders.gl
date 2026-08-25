# BZip2Compression

Decompresses bzip2 data through an optional, lazy `compress-utils` decoder.

Install `compress-utils` only when bzip2 support is needed. See the
[compression benchmarks](/docs/modules/compression/benchmarks) for fallback
comparisons and focused bundle footprint.

## Interface

Implements the [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

Creates a bzip2 decompressor. Import `BZip2CompressUtilsCompression` from
`@loaders.gl/compression/bzip2-compress-utils` when compression or incremental operation is needed.

### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses bzip2 data.
