# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

The `@loaders.gl/crypto` module provides a selection of optional cryptographic hash plugins for loaders.gl.

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

## Using Transforms

The `@loaders.gl/crypto` libraries exports transform that can be used to incrementally calculate a cryptographic hash as data is being loaded and parsed:

```js
import {loadInBatches} from '@loaders.gl/core';
import {CRC32HashTransform} from '@loaders.gl/crypto';

let hash;

const csvIterator = await loadInBatches(CSV_URL, CSVLoader, {
  transforms: [CRC32HashTransform],
  crypto: {
    onEnd: result => {
      hash = result.hash;
    }
  }
});

let csv;
for await (const batch of csvIterator) {
}

console.log(hash);
```

Note that by using a transform, the hash is calculated incrementally as batches are loaded and parsed, and does not require having the entire data source loaded into memory. It also distributes the potentially heavy hash calculation over the batches, keeping the main thread responsive.

## Performance

Note that cryptographic hashing is a computationally expensive operation, linear in the size of the data being hashed. Hashing speeds are currently in the order of ~20-30MB/s on 2019 Macbook Pros.

```
Cryptographic Hash
├─ CRC32HashTransform#run(): 150M bytes/s
├─ CRC32CHashTransform#run(): 151M bytes/s
├─ MD5HashTransform#run(): 75.8M bytes/s
├─ CryptoHashTransform#run(SHA256): 30.6M bytes/s
├─ CryptoHashTransform#run(MD5): 18.9M bytes/s
```
