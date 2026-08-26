// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CompressionOptions} from './lib/compression';
export type {CompressionMetadata} from './compression-types';

export {Compression, Compressor, Decompressor} from './lib/compression';

// Deprecated compatibility exports retained for archive and ZIP consumers.
export {DeflateCompression} from './lib/deflate-compression';
export {GZipCompression} from './lib/gzip-compression';
export {NoCompression} from './lib/no-compression';

export {
  NoCompressor,
  NoDecompressor,
  DeflateCompressor,
  DeflateDecompressor,
  GZipCompressor,
  GZipDecompressor,
  BrotliCompressor,
  BrotliDecompressor,
  SnappyCompressor,
  SnappyDecompressor,
  LZ4Compressor,
  LZ4Decompressor,
  ZstdCompressor,
  ZstdDecompressor,
  BZip2Compressor,
  BZip2Decompressor,
  XZCompressor,
  XZDecompressor
} from './default-codecs';
export type {
  BrotliCompressorOptions,
  BrotliDecompressorOptions,
  DeflateCompressorOptions,
  DeflateDecompressorOptions,
  GZipCompressorOptions,
  GZipDecompressorOptions,
  ZstdCompressorOptions,
  ZstdDecompressorOptions
} from './default-codecs';

export {
  noCompression,
  deflateCompression,
  gzipCompression,
  brotliCompression,
  snappyCompression,
  lz4Compression,
  zstdCompression,
  bzip2Compression,
  xzCompression
} from './compression-metadata';
export {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './native-compression';

export type {CompressionWorkerOptions} from './compress-on-worker';
export {CompressionWorker, compressOnWorker} from './compress-on-worker';
