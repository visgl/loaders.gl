# GZipCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses GZIP encoded data.

Default asynchronous `decompress()` and `decompressBatches()` calls use the runtime's native
`DecompressionStream('gzip')` implementation when available, falling back to the existing codec
otherwise. Explicit codec options, compression, and synchronous decompression keep their existing
codec requirements. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`

- `options` are passed through to the underlying `zlib` or `pako` libraries.
