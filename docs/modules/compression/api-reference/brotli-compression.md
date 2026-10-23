# BrotliCompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Compresses / decompresses Brotli encoded data.

Under Node.js, the `brotli.useZlib` option uses the Brotli decoder bundled with Node.js. When decompressing untrusted data, use the latest patch release of a [supported Node.js version](/docs/developer-guide/node#supported-nodejs-versions).

## Interface

Implements the [`Compression](./compression) API.

## Methods

### `constructor(options?: object)`
