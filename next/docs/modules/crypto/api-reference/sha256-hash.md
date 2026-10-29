Crypto module · hash implementation

# Add a modern digest at the bytes boundary.

SHA256Hash implements the shared Hash API for content addressing, integrity metadata, and compatibility with systems that specify SHA-256.

[Hash API](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)[Crypto module](https://loaders.gl/next/docs/modules/crypto.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

Use it for integrity

## Hash complete content or feed it incrementally.

Use the asynchronous method for a complete buffer, the synchronous method after preload, or the batch method when a source already produces an async iterable of bytes.

01

Input

ArrayBuffer or async binary batches

02

Output

SHA-256 digest in the selected encoding

03

Runtime

Browser and Node.js through the shared API

04

Security

Digest integrity, not a password hash

Detailed guide

## SHA256Hash details

The reference below documents the constructor, preload requirements, and streaming behavior.

# SHA256Hash

![From-v3.0](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

Calculates the SHA256 hash.

## Interface[​](#interface "Direct link to Interface")

Implements the [`Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md) API.

## Methods[​](#methods "Direct link to Methods")

### `constructor(options?: object)`[​](#constructoroptions-object "Direct link to constructoroptions-object")

## Remarks[​](#remarks "Direct link to Remarks")

* This transform supports streaming hashing.
