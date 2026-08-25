# Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`Compressor` and `Decompressor` are the independent base classes for compression transforms.
Use the narrow type in APIs that only encode or only decode data. This lets bundlers discard the
unused half of a codec.

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';

function createWriter(compressors: Compressor[]) {
  // ...
}

function createLoader(decompressors: Decompressor[]) {
  // ...
}
```

Concrete implementations are listed in the
[compressor and decompressor tables](/docs/modules/compression).

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
needed. Call `preload()` explicitly before a sync method when that implementation requires an
optional module.

## Compressor methods

### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Compresses one buffer asynchronously. This is the preferred one-shot API because it can use
built-in streams and initialize optional codecs.

### `compressSync(data: ArrayBuffer): ArrayBuffer`

Compresses one buffer synchronously when supported by the selected implementation. It throws when
that implementation has no synchronous path or has not been preloaded.

### `compressBatches(data): AsyncIterable<ArrayBuffer>`

Compresses iterable or async iterable input buffers. Streaming implementations emit output as it
becomes available. Other implementations concatenate the input and yield one result.

## Decompressor methods

### `decompress(data: ArrayBuffer, size?): Promise<ArrayBuffer>`

Decompresses one buffer asynchronously. `size` is an optional expected or maximum output size for
implementations that need it.

### `decompressSync(data: ArrayBuffer, size?): ArrayBuffer`

Decompresses one buffer synchronously when supported by the selected implementation.

### `decompressBatches(data): AsyncIterable<ArrayBuffer>`

Decompresses iterable or async iterable input buffers. Streaming implementations emit output
incrementally; other implementations yield one result after concatenating the input.

## Combined compatibility class

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

The former `Compression` base class extends `Compressor` and implements `Decompressor`.
Combined codecs therefore remain assignable to either interface:

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';
import {GZipCompression} from '@loaders.gl/compression/gzip-compression';

const gzip = new GZipCompression();
const compressors: Compressor[] = [gzip];
const decompressors: Decompressor[] = [gzip];
```

The combined classes are retained for migration. New code should choose a direction-specific
implementation so it does not bundle operations it never calls.
