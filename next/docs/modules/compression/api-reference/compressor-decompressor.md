Compression API · shared contract

# Move bytes through the codec that fits.

Compressor and Decompressor are the narrow interfaces shared by loaders, writers, and applications. Pick a stable root class for normal use, or select a backend when bundle size, throughput, or reproducibility calls for it.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Built-in codecs](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/built-in-codecs.md)[Live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

The codec contract

## Keep codec choice separate from the data format.

A Parquet reader, a ZIP writer, and an application-level payload can all use the same direction-specific interface. The implementation can change with the runtime without changing the surrounding pipeline.

01

Direction

Compressor for writing; Decompressor for reading

02

Execution

Async, synchronous, and batch operations

03

Selection

Native stream, compact fallback, or explicit backend

04

Portability

Browser and Node.js implementations

Detailed guide

## Shared fields and methods

The reference below defines codec metadata, preload behavior, one-shot methods, batch methods, and error expectations.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`Compressor` and `Decompressor` are the independent base classes for encoding and decoding transforms. Use the narrow type that matches the operation: applications then import only the codec direction they need.

```
import type {Compressor, Decompressor} from '@loaders.gl/compression';



const writerCodecs: Compressor[] = [];

const loaderCodecs: Decompressor[] = [];
```

Library-neutral implementations such as `GZipCompressor` and `GZipDecompressor` are the normal choice. They select a balanced built-in or compact fallback implementation. Backend-named classes are available for applications that deliberately pin a library.

## Shared fields[​](#shared-fields "Direct link to Shared fields")

### `name: string`[​](#name-string "Direct link to name-string")

The canonical format name, such as `gzip` or `zstd`.

### `extensions: string[]`[​](#extensions-string "Direct link to extensions-string")

File extensions commonly associated with the format.

### `contentEncodings: string[]`[​](#contentencodings-string "Direct link to contentencodings-string")

HTTP `Content-Encoding` values associated with the format.

### `isSupported: boolean`[​](#issupported-boolean "Direct link to issupported-boolean")

Whether the implementation can be selected in the current environment.

### `preload(modules?): Promise<Compressor | Decompressor | void>`[​](#preloadmodules-promisecompressor--decompressor--void "Direct link to preloadmodules-promisecompressor--decompressor--void")

Root-level lazy classes return the selected concrete built-in or fallback implementation. Concrete backend classes may simply initialize their dependency. Async operations normally call this when needed. Call `preload()` before a synchronous method on a root-level class.

## Compressor methods[​](#compressor-methods "Direct link to Compressor methods")

### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`[​](#compressdata-arraybuffer-promisearraybuffer "Direct link to compressdata-arraybuffer-promisearraybuffer")

Compresses one buffer asynchronously. This is the preferred one-shot API because it can use built-in streams and initialize optional codecs.

### `compressSync(data: ArrayBuffer): ArrayBuffer`[​](#compresssyncdata-arraybuffer-arraybuffer "Direct link to compresssyncdata-arraybuffer-arraybuffer")

Compresses synchronously when the selected implementation supports it. Otherwise it throws a clear unsupported or preload-required error.

### `compressBatches(data): AsyncIterable<ArrayBuffer>`[​](#compressbatchesdata-asynciterablearraybuffer "Direct link to compressbatchesdata-asynciterablearraybuffer")

Compresses iterable or async iterable buffers. Streaming implementations emit chunks as they become available; non-streaming implementations concatenate the input and yield one result.

## Decompressor methods[​](#decompressor-methods "Direct link to Decompressor methods")

### `decompress(data: ArrayBuffer, size?): Promise<ArrayBuffer>`[​](#decompressdata-arraybuffer-size-promisearraybuffer "Direct link to decompressdata-arraybuffer-size-promisearraybuffer")

Decompresses one buffer asynchronously. `size` supplies an expected or maximum output size to implementations that require one.

### `decompressSync(data: ArrayBuffer, size?): ArrayBuffer`[​](#decompresssyncdata-arraybuffer-size-arraybuffer "Direct link to decompresssyncdata-arraybuffer-size-arraybuffer")

Decompresses synchronously when supported by the selected implementation.

### `decompressBatches(data): AsyncIterable<ArrayBuffer>`[​](#decompressbatchesdata-asynciterablearraybuffer "Direct link to decompressbatchesdata-asynciterablearraybuffer")

Decompresses iterable or async iterable buffers, incrementally when the backend supports streams.

## Choosing a format[​](#choosing-a-format "Direct link to Choosing a format")

* [GZIP](https://loaders.gl/next/docs/modules/compression/api-reference/gzip.md)
* [DEFLATE](https://loaders.gl/next/docs/modules/compression/api-reference/deflate.md)
* [Brotli](https://loaders.gl/next/docs/modules/compression/api-reference/brotli.md)
* [Zstandard](https://loaders.gl/next/docs/modules/compression/api-reference/zstandard.md)
* [Snappy](https://loaders.gl/next/docs/modules/compression/api-reference/snappy.md)
* [LZ4](https://loaders.gl/next/docs/modules/compression/api-reference/lz4.md)
* [bzip2](https://loaders.gl/next/docs/modules/compression/api-reference/bzip2.md)
* [XZ/LZMA](https://loaders.gl/next/docs/modules/compression/api-reference/xz.md)
* [Pass-through transforms](https://loaders.gl/next/docs/modules/compression/api-reference/no-compressor-decompressor.md)

The deprecated combined `Compression` classes are retained for v5 migration but are not the recommended API. See the [v5 upgrade guide](https://loaders.gl/next/docs/upgrade-guide.md) for import replacements.
