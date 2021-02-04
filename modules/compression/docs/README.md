# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

The `@loaders.gl/compression` module provides a small selection of lossless, legally unencumbered compression/decompression (aka deflate/inflate) "transforms" that work as plugins for loaders.gl

## Compression Formats

| Format                            | Intended usage              | Notes                                                   |
| --------------------------------- | --------------------------- | ------------------------------------------------------- |
| [zlib](https://zlib.net/)         | gzip(`.gz`) and Zip(`.zip`) | Essentially the `deflate' method in PKWARE's PKZIP 2.x) |
| [lz4](https://github.com/lz4/lz4) | Arrow Feather               | Optimized for speed (real-time compression)             |

## Decompression API

The API offers "transforms" that can inflate/deflate data.

| Transforms                                                                              | Sync | Description                 |
| --------------------------------------------------------------------------------------- | ---- | --------------------------- |
| [`ZlibDeflateTransform`](modules/compression/docs/api-reference/zlib-deflate-transform) | Y    | Compress using Zlib codec   |
| [`ZlibInflateTransform`](modules/compression/docs/api-reference/zlib-inflate-transform) | Y    | Decompress using Zlib codec |
| [`LZ4DeflateTransform`](modules/compression/docs/api-reference/lz4-deflate-transform)   | Y    | Compress using LZ4 codec    |
| [`LZ4InflateTransform`](modules/compression/docs/api-reference/lz4-inflate-transform)   | Y    | Decompress using LZ4 codec  |
