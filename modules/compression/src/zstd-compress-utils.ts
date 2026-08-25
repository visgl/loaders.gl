// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * Zstandard compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class ZstdCompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'zstd', extensions: ['zst'], contentEncodings: ['zstd']},
      () => import('compress-utils/zstd/compress'),
      () => import('compress-utils/zstd/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
