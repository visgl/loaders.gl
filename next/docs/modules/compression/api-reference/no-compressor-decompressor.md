Compression module · API reference

# Keep uncompressed formats on the same pipeline path.

NoCompressor and NoDecompressor are identity transforms. They let a format select compression at runtime without adding a special branch for the uncompressed case.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Compression formats](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)

The pass-through case

## Select no compression without changing the caller.

The identity implementations preserve input bytes and expose the same method names as real codecs, which keeps format code declarative and easy to test.

01

Compress

Returns the input unchanged

02

Decompress

Returns the input unchanged

03

Methods

Async and synchronous operations

04

Migration

Deprecated NoCompression remains for v5 compatibility

Detailed guide

## Pass-through implementation details

The reference below documents the identity behavior, available methods, shared interface, and v5 migration note.

# NoCompressor and NoDecompressor

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`NoCompressor` and `NoDecompressor` are pass-through transforms. They let a pipeline represent an uncompressed format without a special branch.

```
import {NoCompressor, NoDecompressor} from '@loaders.gl/compression';
```

`compress()`, `compressSync()`, `decompress()`, and `decompressSync()` return the input unchanged. The classes implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs.

The deprecated combined `NoCompression` class remains available for v5 migration.
