Crypto module · hash implementation

# Use MD5 when compatibility is the requirement.

MD5Hash implements the shared Hash API for legacy file formats, cache keys, and interoperability cases. It should not be used for new security-sensitive designs.

[Hash API](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)[Crypto module](https://loaders.gl/next/docs/modules/crypto.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto.md)[SHA256Hash](https://loaders.gl/next/docs/modules/crypto/api-reference/sha256-hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/sha256-hash.md)

Know the boundary

## Separate interoperability from security.

MD5 remains useful when an external protocol or existing dataset specifies it. For collision-resistant integrity or authentication, choose a modern cryptographic construction instead.

01

Use it for

Legacy formats and compatibility checks

02

Interface

Shared async, sync, and batch methods

03

Synchronous hashing

JavaScript implementation; no preload required

04

Avoid for

New security-sensitive applications

Detailed guide

## MD5Hash details

The reference below documents the constructor and shared Hash behavior.

# MD5Hash

![From-v3.0](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

Calculates the MD5 hash. Asynchronous hashing rejects if WASM initialization or hashing fails.

## Interface[​](#interface "Direct link to Interface")

Implements the [`Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md) API.

## Methods[​](#methods "Direct link to Methods")

### `constructor(options?: object)`[​](#constructoroptions-object "Direct link to constructoroptions-object")

### `hashSync(input: ArrayBuffer, encoding: 'hex' | 'base64'): string`[​](#hashsyncinput-arraybuffer-encoding-hex--base64-string "Direct link to hashsyncinput-arraybuffer-encoding-hex--base64-string")

Calculates an MD5 digest synchronously using the vendored JavaScript implementation. No preload or WebAssembly initialization is required. `hash()` continues to use WebAssembly for larger inputs when it is available.

```
import {MD5Hash} from '@loaders.gl/crypto';



const input = new TextEncoder().encode('hello').buffer;

const digest = new MD5Hash().hashSync(input, 'hex');

// '5d41402abc4b2a76b9719d911017c592'
```
