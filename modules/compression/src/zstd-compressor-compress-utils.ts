// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Zstandard compressor backed only by the compress-utils encoder chunk. */
export class ZstdCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'zstd', extensions: ['zst'], contentEncodings: ['zstd']},
      () => import('compress-utils/zstd/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
