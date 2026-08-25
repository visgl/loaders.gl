# Compression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From v2.3" />
</p>

`@loaders.gl/compression` provides lossless compression codecs with one consistent API in browsers
and Node.js. It is designed to keep the common path small: use a built-in codec when the runtime
has one, choose a compact JavaScript implementation when it does not, and load a larger or
specialized implementation only when an application asks for it.

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

## Start here

Choose an implementation based on what your application values most:

| Need | Recommended path |
| --- | --- |
| Smallest initial browser bundle | Try `native-compression` or `native-decompression`, then dynamically import a fallback |
| Compact synchronous GZIP or DEFLATE | Use the `fflate` compressor or decompressor |
| Brotli decompression without WASM | Use the bundled JavaScript decoder shim |
| Compact synchronous Zstandard decompression | Use the `fzstd` decompressor |
| Incremental or broader format support | Use a direction-specific `compress-utils` adapter |
| Existing v4 code | Keep the combined `*Compression` class while migrating; these classes are deprecated, not removed |

The [live benchmarks](/docs/modules/compression/benchmarks) compare the implementations in your
browser, including throughput and focused bundle size.

## Quick start

Import only the direction and implementation you need. This example uses the compact `fflate`
binding and does not retain a GZIP encoder in a decode-only application:

```typescript
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-decompressor-fflate';

const decompressor = new GZipFflateDecompressor();
const data = await decompressor.decompress(compressedData);
```

Compressors and decompressors share stable base types, which makes codec selection easy to pass
through loaders, writers, or application code:

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';
import {GZipFflateCompressor} from '@loaders.gl/compression/gzip-compressor-fflate';
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-decompressor-fflate';

const compressors: Compressor[] = [new GZipFflateCompressor()];
const decompressors: Decompressor[] = [new GZipFflateDecompressor()];
```

## Built-in codecs first

The lightweight `native-compression` and `native-decompression` entrypoints use the runtime's
[`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream) and
[`DecompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream)
implementations. They contain no fallback codec imports. A helper returns `null` when the exact
format is unavailable, so the application can load its chosen fallback only then.

```typescript
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

async function decompressGzip(input: ArrayBuffer): Promise<ArrayBuffer> {
  const builtInOutput = await decompressWithNativeDecompressionStream(input, 'gzip');
  if (builtInOutput) {
    return builtInOutput;
  }

  const {GZipFflateDecompressor} = await import(
    '@loaders.gl/compression/gzip-decompressor-fflate'
  );
  return new GZipFflateDecompressor().decompress(input);
}
```

Browser support differs by codec. GZIP and DEFLATE are widely available; Brotli and Zstandard
support is still runtime-dependent. See
[CompressionStream support](https://caniuse.com/mdn-api_compressionstream),
[DecompressionStream support](https://caniuse.com/mdn-api_decompressionstream), and the
[Chromium Zstandard issue](https://issues.chromium.org/issues/40196713).

| Format | Built-in path | Compact or optional fallback |
| --- | --- | --- |
| GZIP | `CompressionStream` / `DecompressionStream` | `fflate` or Pako |
| DEFLATE | `CompressionStream` / `DecompressionStream` | `fflate` or Pako |
| Raw DEFLATE | `DecompressionStream` when supported | `fflate` or Pako |
| Brotli | Runtime-dependent | bundled JavaScript decoder shim or `compress-utils` |
| Zstandard | Runtime-dependent | `fzstd`, `zstd-codec`, or `compress-utils` |
| Snappy, LZ4, bzip2, XZ | Not exposed by the stream APIs | Selected library adapter |

## Choose a compressor

Each subpath follows `FORMAT-DIRECTION-IMPLEMENTATION` order, making its role apparent before the
library choice—for example, `brotli-decompressor-compress-utils`. The `compress-utils` adapters
are asynchronous, incremental, and backed by an optional dependency. The `fflate` and Pako
adapters are synchronous JavaScript implementations.

| Format | Class | Import subpath | Best for |
| --- | --- | --- | --- |
| Uncompressed | `NoCompressor` | `no-compressor` | Pass-through pipelines |
| GZIP | `GZipFflateCompressor` | `gzip-compressor-fflate` | Compact synchronous JavaScript |
| GZIP | `GZipPakoCompressor` | `gzip-compressor-pako` | Existing Pako-based applications |
| GZIP | `GZipCompressUtilsCompressor` | `gzip-compressor-compress-utils` | Incremental operation |
| DEFLATE | `DeflateFflateCompressor` | `deflate-compressor-fflate` | Compact synchronous JavaScript |
| DEFLATE | `DeflatePakoCompressor` | `deflate-compressor-pako` | Existing Pako-based applications |
| DEFLATE | `DeflateCompressUtilsCompressor` | `deflate-compressor-compress-utils` | Incremental operation |
| Brotli | `BrotliCompressUtilsCompressor` | `brotli-compressor-compress-utils` | Brotli encoding |
| Zstandard | `ZstdCompressUtilsCompressor` | `zstd-compressor-compress-utils` | Zstandard encoding |
| Snappy | `SnappyCompressUtilsCompressor` | `snappy-compressor-compress-utils` | Snappy encoding |
| LZ4 frame | `LZ4CompressUtilsCompressor` | `lz4-compressor-compress-utils` | LZ4 frame encoding |
| bzip2 | `BZip2CompressUtilsCompressor` | `bzip2-compressor-compress-utils` | bzip2 encoding |
| XZ/LZMA | `XZCompressUtilsCompressor` | `xz-compressor-compress-utils` | XZ/LZMA encoding |

## Choose a decompressor

Decode-only entrypoints are especially useful in loaders: they prevent compression code from
being retained in applications that only read data.

| Format | Class | Import subpath | Best for |
| --- | --- | --- | --- |
| Uncompressed | `NoDecompressor` | `no-decompressor` | Pass-through pipelines |
| GZIP | `GZipFflateDecompressor` | `gzip-decompressor-fflate` | Compact synchronous JavaScript |
| GZIP | `GZipPakoDecompressor` | `gzip-decompressor-pako` | Existing Pako-based applications |
| GZIP | `GZipCompressUtilsDecompressor` | `gzip-decompressor-compress-utils` | Incremental operation |
| DEFLATE | `DeflateFflateDecompressor` | `deflate-decompressor-fflate` | Compact synchronous JavaScript |
| DEFLATE | `DeflatePakoDecompressor` | `deflate-decompressor-pako` | Existing Pako-based applications |
| DEFLATE | `DeflateCompressUtilsDecompressor` | `deflate-decompressor-compress-utils` | Incremental operation |
| Brotli | `BrotliShimDecompressor` | `brotli-decompressor-shim` | Bundled JavaScript decoder shim |
| Brotli | `BrotliCompressUtilsDecompressor` | `brotli-decompressor-compress-utils` | Incremental operation |
| Zstandard | `ZstdFzstdDecompressor` | `zstd-decompressor-fzstd` | Compact synchronous JavaScript |
| Zstandard | `ZstdCompressUtilsDecompressor` | `zstd-decompressor-compress-utils` | Incremental operation |
| Snappy | `SnappyCompressUtilsDecompressor` | `snappy-decompressor-compress-utils` | Snappy decoding |
| LZ4 frame | `LZ4CompressUtilsDecompressor` | `lz4-decompressor-compress-utils` | LZ4 frame decoding |
| bzip2 | `BZip2CompressUtilsDecompressor` | `bzip2-decompressor-compress-utils` | bzip2 decoding |
| XZ/LZMA | `XZCompressUtilsDecompressor` | `xz-decompressor-compress-utils` | XZ/LZMA decoding |

## Async, sync, and streaming

Prefer the async methods unless a synchronous call is required. Async methods can use built-in
streams, initialize optional modules, and work with WASM-backed implementations.

- `compress()` and `decompress()` process one buffer asynchronously.
- `compressBatches()` and `decompressBatches()` accept iterable or async iterable buffers.
- `compressSync()` and `decompressSync()` are available where the selected implementation has a
  synchronous codec. Some compatibility codecs require `await preload()` before a sync call.
- A codec with genuine streaming support emits output incrementally. The base classes otherwise
  concatenate the input and yield one result.

`compress-utils`, Pako, `lz4js`, and `zstd-codec` are optional peer dependencies. Only install an
optional package when importing its adapter. `compress-utils` uses direction-specific algorithm
subpaths so unrelated formats can be tree-shaken.

## Metadata and compatibility

The package root exports lightweight descriptors such as `gzipCompression`, `brotliCompression`,
and `zstdCompression`. Their `preload()` method dynamically selects the compatibility codec for
that format. Import an explicit implementation subpath when bundle composition must be
predictable.

The combined classes ending in `Compression` remain available as deprecated v5 compatibility
facades. They implement both [`Compressor` and `Decompressor`](/docs/modules/compression/api-reference/compression),
so existing instances remain assignable to APIs expecting either direction. New applications
should use the narrower classes above.

See the [v5 upgrade guide](/docs/upgrade-guide) for import migrations and behavior changes.

## Formats at a glance

| Format | Typical use | Design emphasis |
| --- | --- | --- |
| GZIP | HTTP content, files ending in `.gz` | Broad compatibility |
| DEFLATE | HTTP content and ZIP internals | Compact, established format |
| Brotli | HTTP content and Parquet | Better density, slower encoding |
| Snappy | Parquet and data systems | Very fast operation |
| LZ4 | Arrow/Feather and data systems | Very fast operation |
| Zstandard | Arrow/Feather, Parquet, and data systems | Strong speed-to-density balance |
| bzip2 | Legacy archives and datasets | Compression density |
| XZ/LZMA | Archives and datasets | High compression density |

For measured comparisons rather than general rules, run the
[compression benchmarks](/docs/modules/compression/benchmarks) on the target browser and hardware.
