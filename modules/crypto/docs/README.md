# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

The `@loaders.gl/crypto` module provides a selection of optional cryptographic hash plugins for loaders.gl.

> This module is a wrapper around [crypto-js](https://github.com/brix/crypto-js) which is an archived project. Make your choices around whether and how to use this module accordingly (i.e. building on a module that is not actively maintenaned is not ideal for security related algorithms).

## Cryptographic Formats

MD5, SHA256 and many more, see [crypto-js](https://github.com/brix/crypto-js)

## Cryptographic Hash API

The API offers "transforms" that can calculate a cryptographic hash incrementally on data as it comes in on a stream.

| Transforms                                                                              | Sync | Description                       |
| --------------------------------------------------------------------------------------- | ---- | --------------------------------- |
| [`CRC32HashTransform`](modules/crypto/docs/api-reference/crc32-hash-transform)          | Y    | Base64-encoded Cryptographic Hash |
| [`CRC32CHashTransform`](modules/crypto/docs/api-reference/crc32c-hash-transform)        | Y    | Base64-encoded Cryptographic Hash |
| [`MD5HashTransform`](modules/crypto/docs/api-reference/md5-hash-transform)              | Y    | Base64-encoded Cryptographic Hash |
| [`CryptographicHashTransform`](modules/crypto/docs/api-reference/crypto-hash-transform) | Y    | Base64-encoded Cryptographic Hash |

## Performance

Note that cryptographic hashing is a computationally expensive operation, linear in the size of the data being hashed. Hashing speeds are currently in the order of ~20-30MB/s on 2019 Macbook Pros.

```
Cryptographic Hash
├─ CRC32HashTransform#hash(): 150M bytes/s
├─ CRC32CHashTransform#hash(): 151M bytes/s
├─ MD5HashTransform#hash(): 75.8M bytes/s
├─ CryptoHashTransform#hashSync(SHA256): 30.6M bytes/s
├─ CryptoHashTransform#hash(MD5): 18.9M bytes/s
```
