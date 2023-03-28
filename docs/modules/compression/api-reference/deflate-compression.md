# DeflateCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses DEFLATE encoded data.

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`

- `options` are passed through to the underlying `zlib` or `pako` libraries.
