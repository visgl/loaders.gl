Crypto module

# Hash data while it is moving through the pipeline.

`@loaders.gl/crypto` provides optional CRC32, CRC32C, MD5, and SHA-256 transforms. Attach one to a batch-loading path when integrity, checksums, or content identity matter without first buffering the complete source.

[Hash API](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/crypto/api-reference/hash.md)[Using streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)[Worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

The hashing path

## Receive batches. Update the digest. Read the result.

Hash transforms consume the same incremental batches as the rest of the loaders.gl pipeline. Choose the encoding required by the service or file format that will receive the digest.

01

Input

Binary or text batches from a loader

02

Algorithms

CRC32, CRC32C, MD5, and SHA-256

03

Encoding

Hex or base64 digest output

04

Result

Final digest from the transform lifecycle

Detailed guide

## Hash algorithms and transform details

The reference below covers supported algorithms, digest encodings, transform usage, synchronous methods, and performance considerations.

![From-v3.0](https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square)

The `@loaders.gl/crypto` module provides a selection of optional cryptographic hash plugins for loaders.gl.

Terminology:

* A **hash** is an

## Cryptographic algorithms[​](#cryptographic-algorithms "Direct link to Cryptographic algorithms")

MD5, SHA256 and many more, see [crypto-js](https://github.com/brix/crypto-js)

## Encoding[​](#encoding "Direct link to Encoding")

A hash algorithm takes input data and generates a digest. The digest is a number, usually containing a fixed number of bits. Since the number of bits involved is often large (e.g. SHA256 generates a 256 bit digest), digests are typically encoded as strings instead of numbers.

The two most common string encodings of numbers are *hex* and *base64*. Which one you want to use often depends on what you are planning to do with the digest. If you are calling an existing API (perhaps a cloud storage service) you will want to generate the encoding that matches or is required by that API.

All hash functions in the `@loaders.gl/crypto` module take an `encoding` parameter that lets you specify the encoding.

## Hash and checksum API[​](#hash-and-checksum-api "Direct link to Hash and checksum API")

The API offers "transforms" that can calculate a hash or checksum incrementally on data as it comes in on a stream.

| Transforms                                                                                    | Sync | Description                       |
| --------------------------------------------------------------------------------------------- | ---- | --------------------------------- |
| [`CRC32Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32-hash.md)   | ✅ Y | Checksum (hex or base64)          |
| [`CRC32CHash`](https://loaders.gl/next/docs/modules/crypto/api-reference/crc32c-hash.md) | ✅ Y | Checksum (hex or base64)          |
| [`MD5Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/md5-hash.md)       | ✅ Y | Base64-encoded Cryptographic Hash |
| [`SHA256Hash`](https://loaders.gl/next/docs/modules/crypto/api-reference/sha256-hash.md) | ✅ Y | Base64-encoded Cryptographic Hash |

## Using transforms[​](#using-transforms "Direct link to Using transforms")

The `@loaders.gl/crypto` module exports transforms that can be used to incrementally calculate a hash or checksum as data is being loaded and parsed:

```
import {loadInBatches} from '@loaders.gl/core';

import {CRC32Hash} from '@loaders.gl/crypto';

import {CSVLoader} from '@loaders.gl/tables/csv';



const checksum = new CRC32Hash({

  encoding: 'hex',

  onEnd: ({hash}) => console.log(hash)

});

const csvIterator = await loadInBatches(CSV_URL, CSVLoader, {

  core: {transforms: [checksum.hashBatches]}

});

for await (const batch of csvIterator) {

  // Process each parsed CSV batch.

}
```

Note that by using a transform, the hash is calculated incrementally as batches are loaded and parsed, and does not require having the entire data source loaded into memory. It also distributes the potentially heavy hash calculation over the batches, keeping the main thread responsive.

## Performance[​](#performance "Direct link to Performance")

Note that cryptographic hashing is a computationally expensive operation, linear in the size of the data being hashed. Hashing speeds are currently in the order of 30-150MB/s on a 2019 MacBook Pro:

```
Cryptographic Hash

├─ CRC32Hash#run(): 150M bytes/s

├─ CRC32CHash#run(): 151M bytes/s

├─ MD5Hash#run(): 75.8M bytes/s

├─ SHA256Hash#run(SHA256): 30.6M bytes/s
```

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/crypto/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
