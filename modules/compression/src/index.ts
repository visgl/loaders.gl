// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CompressionOptions} from './lib/compression';

export {Compressor, Decompressor} from './lib/compression';

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
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './native-compression';

export type {CompressionWorkerOptions} from './compress-on-worker';
export {CompressionWorker, compressOnWorker} from './compress-on-worker';
