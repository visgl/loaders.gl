# Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

`Compressor` and `Decompressor` are the independent base classes for loaders.gl compression
transforms. Use the narrow class in APIs and arrays that only need one direction.

```typescript
import type {Compressor, Decompressor} from '@loaders.gl/compression';

const compressors: Compressor[] = [];
const decompressors: Decompressor[] = [];
```

The former combined `Compression` base extends `Compressor` and implements `Decompressor`, so a
combined compatibility codec remains assignable to either type.

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`Compression` and concrete classes ending in `Compression` are deprecated compatibility facades.
New code should import a direction-specific class from the [compressor and decompressor tables](/docs/modules/compression).

## Fields

#### `name`: string

The name of the compression scheme

#### `isSupported`: string

## Methods

#### `preload(): Promise<void>`

Asynchronously loads required libraries. For some compressions this must be completed before
`compressSync()` and `decompressSync()` are available.

### Compressor methods

#### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously compresses data.

#### `compressSync(data: ArrayBuffer): ArrayBuffer`

Synchronously compresses data.

For some compressions `preload()` must have been called and completed before
synchronous operations are available.

#### `compressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>`

Asynchronously compresses data in batches.

If the underlying compression does not support streaming compression,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single compressed batch will be yielded.

### Decompressor methods

#### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses data.

#### `decompressSync(data: ArrayBuffer): ArrayBuffer`

Synchronously decompresses data.

For some decompressors `preload()` must have been called and completed before synchronous
operations are available.

#### `decompressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>`

Asynchronously decompresses data.

Note: If the underlying compression does not support streaming compression,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single decompressed batch will be yielded.
