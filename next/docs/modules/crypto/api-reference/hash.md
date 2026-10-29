Crypto module · API reference

# Hash data without coupling the pipeline to one runtime.

The Hash base class gives synchronous, asynchronous, and batched hashing implementations one shape. Choose the algorithm separately from the code that feeds it bytes.

[Crypto module](https://loaders.gl/next/docs/modules/crypto.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto.md)[CRC32Hash](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32-hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32-hash.md)[SHA256Hash](https://loaders.gl/next/docs/modules/crypto/api-reference/sha256-hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/sha256-hash.md)

Choose the operation

## Keep hashing at the same boundary as the bytes.

Use hash() for a complete buffer, hashSync() when the implementation is already loaded, and hashBatches() when data arrives through a streaming pipeline.

01

Algorithm

Select a concrete Hash implementation

02

Async

Hash one ArrayBuffer without blocking the caller

03

Sync

Use a preloaded implementation for local work

04

Batches

Hash an AsyncIterable of binary chunks

Detailed guide

## Hash API details

The reference below documents support detection, preload requirements, output encodings, and the fallback behavior for non-streaming algorithms.

# Hash

![From-v3.0](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

`Hash` is the abstract base class for loaders.gl hash classes.

## Fields[​](#fields "Direct link to Fields")

#### `name`: string[​](#name-string "Direct link to name-string")

The name of the hash algorithm

#### `isSupported`: boolean[​](#issupported-boolean "Direct link to issupported-boolean")

## Methods[​](#methods "Direct link to Methods")

#### `preload()`[​](#preload "Direct link to preload")

`preload(): Promise<void>`

Asynchronously loads required libraries. For some hash classes this must be completed before `hashSync()` is available.

#### `hash()`[​](#hash-1 "Direct link to hash-1")

```
  hash.hash(data: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<ArrayBuffer>
```

Asynchronously hashes data.

#### `hashSync()`[​](#hashsync "Direct link to hashsync")

```
  hash.hashSync(data: ArrayBuffer, encoding: 'hex' | 'base64'): ArrayBuffer
```

Synchronously hashes data.

caution

For some hash sub classes, `preload()` must have been called and completed before synchronous operations are available.

#### `hashInBactches()`[​](#hashinbactches "Direct link to hashinbactches")

```
  hash.hashBatches(data: AsyncIterable<ArrayBuffer>, encoding: 'hex' | 'base64'): AsyncIterable<ArrayBuffer>
```

Asynchronously hashes data in batches.

If the underlying hashion does not support streaming hashion, the incoming data will be concatenated into a single `ArrayBuffer` and a single hashed batch will be yielded.
