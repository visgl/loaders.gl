# XZCompression

Decompresses XZ/LZMA data through an optional, lazy `compress-utils` decoder.

Install `compress-utils` only when XZ support is needed. See the
[compression benchmarks](/docs/modules/compression/benchmarks) for fallback
comparisons and focused bundle footprint.

## Interface

Implements the [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

Creates an XZ decompressor. Import `XZCompressUtilsCompression` from
`@loaders.gl/compression/xz-compress-utils` when compression or incremental operation is needed.

### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses XZ data.
