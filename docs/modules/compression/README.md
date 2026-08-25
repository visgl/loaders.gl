# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `@loaders.gl/compression` module provides a selection of lossless,
compression/decompression "transforms" with a unified interface that work both in browsers and in Node.js

For async code that only needs decompression, the lightweight
[`@loaders.gl/compression/native-decompression`](/docs/modules/compression/api-reference/native-decompression)
entrypoint probes the runtime's
`DecompressionStream` implementation for gzip, deflate, raw deflate, Brotli, and Zstandard. The
entrypoint has no codec imports, so supported runtimes do not pull fallback codec code into the
initial bundle. It returns `null` when the runtime or exact format is unavailable, allowing callers
to load a fallback only when needed.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

Async compression classes now prefer native runtime streams and lazily load codec fallbacks when
needed. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

## Built-in decompression

The lightweight native entrypoint uses the browser's built-in
[`DecompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream)
when the requested format is supported. This keeps fallback codecs out of the initial bundle.
Support varies by browser and format; see [Can I use DecompressionStream](https://caniuse.com/mdn-api_decompressionstream)
for browser coverage.

| Format | Built-in path | Fallback path |
| --- | --- | --- |
| GZIP, DEFLATE, raw DEFLATE | `DecompressionStream` | `fflate` |
| Brotli | `DecompressionStream` when available | lazy Brotli decoder |
| Zstandard | `DecompressionStream` when available | `fzstd` or injected `zstd-codec` |
| Snappy, bzip2, XZ | Not currently available through `DecompressionStream` | lazy codec implementation |

See the [live compression benchmarks](/docs/modules/compression/benchmarks) for throughput,
footprint, and browser-native comparisons. The benchmark includes links to each external library
and tracks [Chromium's Zstandard support](https://issues.chromium.org/issues/40196713).

```typescript
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

async function decompressGzip(input: ArrayBuffer): Promise<ArrayBuffer> {
  const output = await decompressWithNativeDecompressionStream(input, 'gzip');
  if (output) {
    return output;
  }
  const {GZipCompression} = await import('@loaders.gl/compression/gzip-compression');
  return new GZipCompression().decompress(input);
}
```

Parquet, Avro, and SPZ parsing use this lightweight path automatically before lazily loading their
codec-backed fallbacks.

## Selecting a library implementation

<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

The package root exposes library-neutral format metadata. Concrete compressor and decompressor
classes have independently importable subpaths, mirroring the separation between loaders and
writers. Selecting one direction prevents an encoder from being retained by a decode-only
application, or a decoder from being retained by an encode-only application.

### Compressors

| Format | Class | Import subpath | Characteristics |
| --- | --- | --- | --- |
| Uncompressed | `NoCompressor` | `no-compressor` | Pass-through |
| GZIP | `GZipFflateCompressor` | `gzip-fflate-compressor` | Compact, synchronous JavaScript |
| GZIP | `GZipPakoCompressor` | `gzip-pako-compressor` | Pako, synchronous JavaScript |
| GZIP | `GZipCompressUtilsCompressor` | `gzip-compress-utils-compressor` | WASM, async and incremental |
| DEFLATE | `DeflateFflateCompressor` | `deflate-fflate-compressor` | Compact, synchronous JavaScript |
| DEFLATE | `DeflatePakoCompressor` | `deflate-pako-compressor` | Pako, synchronous JavaScript |
| DEFLATE | `DeflateCompressUtilsCompressor` | `deflate-compress-utils-compressor` | WASM, async and incremental |
| Brotli | `BrotliCompressUtilsCompressor` | `brotli-compress-utils-compressor` | WASM, async and incremental |
| Zstandard | `ZstdCompressUtilsCompressor` | `zstd-compress-utils-compressor` | WASM, async and incremental |
| Snappy | `SnappyCompressUtilsCompressor` | `snappy-compress-utils-compressor` | WASM, async and incremental |
| LZ4 frame | `LZ4CompressUtilsCompressor` | `lz4-compress-utils-compressor` | WASM, async and incremental |
| bzip2 | `BZip2CompressUtilsCompressor` | `bzip2-compress-utils-compressor` | WASM, async and incremental |
| XZ/LZMA | `XZCompressUtilsCompressor` | `xz-compress-utils-compressor` | WASM, async and incremental |

### Decompressors

| Format | Class | Import subpath | Characteristics |
| --- | --- | --- | --- |
| Uncompressed | `NoDecompressor` | `no-decompressor` | Pass-through |
| GZIP | `GZipFflateDecompressor` | `gzip-fflate-decompressor` | Compact, synchronous JavaScript |
| GZIP | `GZipPakoDecompressor` | `gzip-pako-decompressor` | Pako, synchronous JavaScript |
| GZIP | `GZipCompressUtilsDecompressor` | `gzip-compress-utils-decompressor` | WASM, async and incremental |
| DEFLATE | `DeflateFflateDecompressor` | `deflate-fflate-decompressor` | Compact, synchronous JavaScript |
| DEFLATE | `DeflatePakoDecompressor` | `deflate-pako-decompressor` | Pako, synchronous JavaScript |
| DEFLATE | `DeflateCompressUtilsDecompressor` | `deflate-compress-utils-decompressor` | WASM, async and incremental |
| Brotli | `BrotliLoadersGLDecompressor` | `brotli-loaders-gl-decompressor` | Compact synchronous JavaScript |
| Brotli | `BrotliCompressUtilsDecompressor` | `brotli-compress-utils-decompressor` | WASM, async and incremental |
| Zstandard | `ZstdFzstdDecompressor` | `zstd-fzstd` | Compact synchronous JavaScript |
| Zstandard | `ZstdCompressUtilsDecompressor` | `zstd-compress-utils-decompressor` | WASM, async and incremental |
| Snappy | `SnappyCompressUtilsDecompressor` | `snappy-compress-utils-decompressor` | WASM, async and incremental |
| LZ4 frame | `LZ4CompressUtilsDecompressor` | `lz4-compress-utils-decompressor` | WASM, async and incremental |
| bzip2 | `BZip2CompressUtilsDecompressor` | `bzip2-compress-utils-decompressor` | WASM, async and incremental |
| XZ/LZMA | `XZCompressUtilsDecompressor` | `xz-compress-utils-decompressor` | WASM, async and incremental |

For example:

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';
import {GZipFflateCompressor} from '@loaders.gl/compression/gzip-fflate-compressor';
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-fflate-decompressor';

const compressors: Compressor[] = [new GZipFflateCompressor()];
const decompressors: Decompressor[] = [new GZipFflateDecompressor()];
```

`compress-utils`, Pako, lz4js, and zstd-codec are optional peer dependencies. The
`compress-utils` adapters use direction-specific imports and expose incremental compression and
decompression. Applications only pay for the implementation subpaths they import.

The combined classes ending in `Compression` remain available as deprecated v5 compatibility
facades. Every combined class implements both the `Compressor` and `Decompressor` contracts, so it
can still be supplied to an API expecting either direction. New code should use the direction-
specific classes in the tables above.

## Compatibility classes

The former combined API remains documented for migration purposes: [`Compression`](/docs/modules/compression/api-reference/compression),
[`GZipCompression`](/docs/modules/compression/api-reference/gzip-compression),
[`DeflateCompression`](/docs/modules/compression/api-reference/deflate-compression),
[`BrotliCompression`](/docs/modules/compression/api-reference/brotli-compression),
[`LZ4Compression`](/docs/modules/compression/api-reference/lz4-compression),
[`SnappyCompression`](/docs/modules/compression/api-reference/snappy-compression), and
[`ZstdCompression`](/docs/modules/compression/api-reference/zstd-compression).

## Compression Formats

### Gzip

`GZIP` uses `DEFLATE` compression data, wrapping `DEFLATE` compression data with
a header and a checksum. The `GZIP` format is the most commonly used HTTP compression
scheme, and it is also produced by `gzip` tool.

### Deflate

`DEFLATE` is a patent-free compression algorithm for lossless data compression.
`DEFLATE` is a major HTTP compression scheme, and is also used internally in Zip archives
(`.zip` files).

### Brotli

`Brotli` is a newer HTTP compression scheme that results in better (~20%)
compressed data sizes at the cost of slower compression.
Also used internally in e.g. Apache Parquet files.

Note that in contrast to Gzip and Deflate, `brotli` is not
supported by all browsers. Therefore resources are usually served
in both `brotli` and `gzip` versions by a server that understands
the `Accept-Encoding` HTTP header.

### LZ4

[`LZ4`](<https://en.wikipedia.org/wiki/LZ4_(compression_algorithm)>)
is a real-time compression format focused on speed.
Used in e.g. Apache Arrow `.feather` files.

### Zstandard

`Zstandard` is a real-time compression format focused on speed.
Used in e.g. Apache Arrow `.feather` files.

### Snappy

`Snappy` (Previously known as `Zippy`) is a real-time compression format that
targets very high compression (GB/s) speed at the cost of compressed size.
Used in e.g. Apache Parquet files.

## Attributions

MIT licensed. This module does not fork any code. however it includes npm dependencies as follows:

| --- | ---
| [pako](https://zlib.net/) | MIT |
| [lz4](https://github.com/lz4/lz4) | |
| [lz4](https://github.com/lz4/lz4) | |
| [snappy](https://github.com/lz4/lz4) | |
| [brotli](https://github.com/lz4/lz4) | Arrow Feather | Optimized for speed (real-time compression) |
|
