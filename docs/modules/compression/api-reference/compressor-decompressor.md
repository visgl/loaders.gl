# Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`Compressor` and `Decompressor` are the independent base classes for encoding and decoding
transforms. Use the narrow type that matches the operation: applications then import only the
codec direction they need.

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';

const writerCodecs: Compressor[] = [];
const loaderCodecs: Decompressor[] = [];
```

Library-neutral implementations such as `GZipCompressor` and `GZipDecompressor` are the normal
choice. They select a balanced built-in or compact fallback implementation. Backend-named classes
are available for applications that deliberately pin a library.

## Shared fields

### `name: string`

The canonical format name, such as `gzip` or `zstd`.

### `extensions: string[]`

File extensions commonly associated with the format.

### `contentEncodings: string[]`

HTTP `Content-Encoding` values associated with the format.

### `isSupported: boolean`

Whether the implementation can be selected in the current environment.

### `preload(modules?): Promise<void>`

Initializes injected or dynamically loaded dependencies. Async operations normally do this when
needed. Call `preload()` before a synchronous method when its backend requires an optional module.

## Compressor methods

### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Compresses one buffer asynchronously. This is the preferred one-shot API because it can use
built-in streams and initialize optional codecs.

### `compressSync(data: ArrayBuffer): ArrayBuffer`

Compresses synchronously when the selected implementation supports it. Otherwise it throws a
clear unsupported or preload-required error.

### `compressBatches(data): AsyncIterable<ArrayBuffer>`

Compresses iterable or async iterable buffers. Streaming implementations emit chunks as they
become available; non-streaming implementations concatenate the input and yield one result.

## Decompressor methods

### `decompress(data: ArrayBuffer, size?): Promise<ArrayBuffer>`

Decompresses one buffer asynchronously. `size` supplies an expected or maximum output size to
implementations that require one.

### `decompressSync(data: ArrayBuffer, size?): ArrayBuffer`

Decompresses synchronously when supported by the selected implementation.

### `decompressBatches(data): AsyncIterable<ArrayBuffer>`

Decompresses iterable or async iterable buffers, incrementally when the backend supports streams.

## Choosing a format

- [GZIP](./gzip)
- [DEFLATE](./deflate)
- [Brotli](./brotli)
- [Zstandard](./zstandard)
- [Snappy](./snappy)
- [LZ4](./lz4)
- [bzip2](./bzip2)
- [XZ/LZMA](./xz)
- [Pass-through transforms](./no-compressor-decompressor)

The deprecated combined `Compression` classes are retained for v5 migration but are not the
recommended API. See the [v5 upgrade guide](/docs/upgrade-guide) for import replacements.
