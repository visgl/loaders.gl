Compression API · runtime selection

# Use the runtime’s codec before shipping another one.

The built-in helpers probe CompressionStream and DecompressionStream for supported formats, then return control to a compact fallback when the browser or Node.js runtime cannot provide the native path.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

The built-in path

## Probe capability without making it your application’s problem.

Native support varies by format and runtime. The helpers return a usable result when the native stream exists and a clear null when the caller should select a fallback.

01

Compression

gzip, deflate, brotli, and zstd where supported

02

Decompression

gzip, deflate, deflate-raw, brotli, and zstd where supported

03

Fallback

Load a compact or specialized implementation only when needed

04

Measurement

Use the browser benchmark page for current support and throughput

Detailed guide

## Native helpers and fallback selection

The sections below document helper entry points, accepted format names, null behavior, and error handling after stream creation.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The default GZIP, DEFLATE, Brotli, and Zstandard classes first ask the runtime for a built-in `CompressionStream` or `DecompressionStream`. Built-in codecs add no JavaScript codec bytes and typically offer excellent throughput. Availability varies by format and runtime, so every default class has a documented fallback.

Most applications should simply use a format default:

```
import {GZipDecompressor} from '@loaders.gl/compression';



const data = await new GZipDecompressor().decompress(compressedData);
```

## Low-level helpers[​](#low-level-helpers "Direct link to Low-level helpers")

Applications that want full control over fallback loading can import the lightweight helpers:

```
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';



const builtInOutput = await decompressWithNativeDecompressionStream(compressedData, 'gzip');

if (!builtInOutput) {

  const {GZipDecompressor} = await import('@loaders.gl/compression/gzip-decompressor');

  return new GZipDecompressor({useNative: false}).decompress(compressedData);

}
```

| Entry point            | One-shot helper                             | Batch helper                                       |
| ---------------------- | ------------------------------------------- | -------------------------------------------------- |
| `native-compression`   | `compressWithNativeCompressionStream()`     | `compressBatchesWithNativeCompressionStream()`     |
| `native-decompression` | `decompressWithNativeDecompressionStream()` | `decompressBatchesWithNativeDecompressionStream()` |

The helpers return `null` when the stream API or exact format is unavailable. Once a stream has been created, codec or input errors are reported to the caller.

Compression accepts `gzip`, `deflate`, `brotli`, and `zstd`. Decompression additionally accepts `deflate-raw`. Consult the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) for the support detected by the current browser.
