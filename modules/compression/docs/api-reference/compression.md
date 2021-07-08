# Compression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

`Compression` is the abstract base class for loaders.gl compressions.

## Fields

#### `name`: string

The name of the compression scheme

#### `isSupported`: string

## Methods

#### `preload(): Promise<void>`

Asynchronously loads required libraries. For some compressions this must be completed before
`compressSync()` and `decompressSync()` are available.

#### `compress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously compresses data.

#### `decompress(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously decompresses data.

#### `compressSync(data: ArrayBuffer): ArrayBuffer`

Synchronously compresses data.

For some compressions `preload()` must have been called and completed before
synchronous operations are available.

#### `decompressSync(data: ArrayBuffer): ArrayBuffer`

Asynchronously decompresses data.

For some compressions `preload()` must have been called and completed before
synchronous operations are available.


#### `compressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>`

Asynchronously compresses data in batches.

If the underlying compression does not support streaming compression,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single compressed batch will be yielded.

#### `decompressBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>`

Asynchronously decompresses data.

Note: If the underlying compression does not support streaming compression,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single decompressed batch will be yielded.
