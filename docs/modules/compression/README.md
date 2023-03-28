# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `@loaders.gl/compression` module provides a selection of lossless,
compression/decompression "transforms" with a unified interface that work both in browsers and in Node.js

## API

| Compression Class | Format | Characteristics | Library Size | Notes                                                   |
| --------------------------------- | --------------------------- | ------------------------------------------------------- | --- | --- |
| [`NoCompression`](./api-reference/no-compression) |  none  |  -         | - |
| [`GzipCompression`](./api-reference/gzip-compression)  | gzip(`.gz`) | size | [Small](https://bundlephobia.com/package/pako) |
| [`DeflateCompression`](./api-reference/deflate-compression) | DEFLATE(PKZIP) | size | [Small](https://bundlephobia.com/package/pako) |
| [`LZ4Compression`](./api-reference/lz4-compression) | LZ4  |  speed ("real-time")             | [Medium](https://bundlephobia.com/package/lz4) |
| [`ZstdCompression`](./api-reference/zstd-compression) | Zstandard |  speed ("real-time")             | [Large](https://bundlephobia.com/package/zstd-codec) |
| [`SnappyCompression`](./api-reference/snappy-compression) | Snappy(Zippy)  |  speed ("real-time")              | [Small](https://bundlephobia.com/package/snappys) |
| [`BrotliCompression`](./api-reference/brotli-compression) | Brotli  | Size, fast decompress, slow compress             | [Large](https://bundlephobia.com/package/brotli) |
| [`LZOCompression`](./api-reference/lzo-compression)   | Lempel-Ziv-Oberheimer | size | Node.js only

## Compression Formats

### Gzip

`GZIP` uses `DEFLATE` compression data, wrapping `DEFLATE` compression data with
a header and a checksum. The `GZIP` format is the most commonly used HTTP compression
scheme, and it is also produced by `gzip` tool.

### Deflate

`DEFLATE` is a patent-free compression algorithm for lossless data compression.
`DEFLATE` is a major HTTP compression scheme, and is also used internally in Zip archives
(`.zip` files).

### Brotli

`Brotli` is a newer HTTP compression scheme that results in better (~20%)
compressed data sizes at the cost of slower compression.
Also used internally in e.g. Apache Parquet files.

Note that in contrast to Gzip and Deflate, `brotli` is not
supported by all browsers. Therefore resources are usually served
in both `brotli` and `gzip` versions by a server that understands
the `Accept-Encoding` HTTP header.

### LZ4

[`LZ4`](https://en.wikipedia.org/wiki/LZ4_(compression_algorithm))
is a real-time compression format focused on speed.
Used in e.g. Apache Arrow `.feather` files.

### Zstandard

`Zstandard` is a real-time compression format focused on speed.
Used in e.g. Apache Arrow `.feather` files.

### Snappy

`Snappy` (Previously known as `Zippy`) is a real-time compression format that
targets very high compression (GB/s) speed at the cost of compressed size.
Used in e.g. Apache Parquet files.

### LZO (Lempel-Ziv-Oberheimer)

`Snappy` (Previously known as `Zippy`) is a real-time compression format that
targets very high compression (GB/s) speed at the cost of compressed size.
Used in e.g. Apache Parquet files.

## Attributions

MIT licensed. This module does not fork any code. however it includes npm dependencies as follows:

| --- | ---
| [pako](https://zlib.net/)         | MIT |
| [lz4](https://github.com/lz4/lz4) |  |
| [lz4](https://github.com/lz4/lz4) |  |
| [snappy](https://github.com/lz4/lz4) |              |
| [brotli](https://github.com/lz4/lz4) | Arrow Feather               | Optimized for speed (real-time compression)             |
|
