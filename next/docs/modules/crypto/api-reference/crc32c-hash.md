Crypto module · hash implementation

# Use CRC32C where the storage format names it.

CRC32CHash exposes the Castagnoli checksum through a small static and streaming-friendly API for format validation and block integrity.

[Hash API](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)[Crypto module](https://loaders.gl/next/docs/modules/crypto.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto.md)[CRC32Hash](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32-hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32-hash.md)

Use it for integrity

## Match the checksum to the format.

CRC32C is a fast non-cryptographic checksum used by systems and storage formats that specify the Castagnoli polynomial.

01

Input

A byte array or binary batch

02

Output

CRC32C checksum string

03

Strength

Fast detection of accidental changes

04

Not for

Cryptographic authentication

Detailed guide

## CRC32CHash details

The reference below documents the static method and streaming behavior.

# CRC32CHash

![From-v2.3](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

## Static Methods[​](#static-methods "Direct link to Static Methods")

#### `CRC32CHash.hash(data: ArrayBuffer, options?: object): Promise<string>`[​](#crc32chashhashdata-arraybuffer-options-object-promisestring "Direct link to crc32chashhashdata-arraybuffer-options-object-promisestring")

Calculates the CRC32c hash of a byte array.

## Remarks[​](#remarks "Direct link to Remarks")

* This transform supports streaming hashing.
