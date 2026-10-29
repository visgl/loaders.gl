Crypto module · hash implementation

# Add a fast checksum to a binary pipeline.

CRC32Hash provides the shared Hash interface for integrity checks and streaming transforms where a cryptographic digest is not required.

[Hash API](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)[Crypto module](https://loaders.gl/next/docs/modules/crypto.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

Use it for integrity

## Checksum bytes while they move.

CRC32 is useful for detecting accidental corruption and validating blocks during transfer. It is not intended to provide cryptographic security.

01

Input

ArrayBuffer or async binary batches

02

Output

CRC32 checksum in the Hash result encoding

03

Strength

Fast accidental-corruption detection

04

Not for

Authentication or adversarial integrity

Detailed guide

## CRC32Hash details

The reference below documents the constructor, shared interface, and streaming behavior.

# CRC32Hash

![From-v3.0](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

Calculates the CRC32C hash.

## Interface[​](#interface "Direct link to Interface")

Implements the [`Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md) API.

## Methods[​](#methods "Direct link to Methods")

### `constructor(options?: object)`[​](#constructoroptions-object "Direct link to constructoroptions-object")

## Remarks[​](#remarks "Direct link to Remarks")

* This transform supports streaming hashing.
