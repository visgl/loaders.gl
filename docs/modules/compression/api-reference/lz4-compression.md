# LZ4Compression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`LZ4Compression` is the combined LZ4 compatibility codec. It decodes raw LZ4 blocks and legacy
Hadoop-framed blocks with the compact loaders.gl implementation. LZ4 frame encoding and decoding
use the optional `lz4js` module.

For new LZ4 frame code, select the `compress-utils` adapter for the required direction. See the
[implementation tables](/docs/modules/compression) and
[live benchmarks](/docs/modules/compression/benchmarks).

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

`options.modules.lz4js` may inject the frame codec. Raw block decoding also requires the expected
uncompressed size as the second argument to `decompress()` or `decompressSync()`.
