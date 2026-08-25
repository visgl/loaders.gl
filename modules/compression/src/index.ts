// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CompressionOptions} from './lib/compression';
export type {CompressionMetadata} from './compression-types';

export {Compression, Compressor, Decompressor} from './lib/compression';

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
