---
title: Compressor and Decompressor
description: Use one typed interface for lossless compression and decompression across runtimes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · shared contract"
  title="Move bytes through the codec that fits."
  description="Compressor and Decompressor are the narrow interfaces shared by loaders, writers, and applications. Pick a stable root class for normal use, or select a backend when bundle size, throughput, or reproducibility calls for it."
  tone="violet"
  meta={['Compress and decompress', 'One-shot and batches', 'Runtime-aware codecs']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Built-in codecs', to: '/docs/modules/compression/api-reference/built-in-codecs'},
    {label: 'Live benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="The codec contract"
  title="Keep codec choice separate from the data format."
  description="A Parquet reader, a ZIP writer, and an application-level payload can all use the same direction-specific interface. The implementation can change with the runtime without changing the surrounding pipeline."
  tone="violet"
  items={[
    {label: 'Direction', value: 'Compressor for writing; Decompressor for reading'},
    {label: 'Execution', value: 'Async, synchronous, and batch operations'},
    {label: 'Selection', value: 'Native stream, compact fallback, or explicit backend'},
    {label: 'Portability', value: 'Browser and Node.js implementations'}
  ]}
/>

<ReferenceBoundary
  title="Shared fields and methods"
  description="The reference below defines codec metadata, preload behavior, one-shot methods, batch methods, and error expectations."
  tone="violet"
/>

<p className="badges">
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

### `preload(modules?): Promise<Compressor | Decompressor | void>`

Root-level lazy classes return the selected concrete built-in or fallback implementation. Concrete
backend classes may simply initialize their dependency. Async operations normally call this when
needed. Call `preload()` before a synchronous method on a root-level class.

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
