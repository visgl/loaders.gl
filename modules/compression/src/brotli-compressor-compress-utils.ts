// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Brotli compressor backed only by the compress-utils encoder chunk. */
export class BrotliCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'brotli', extensions: ['br'], contentEncodings: ['br']},
      () => import('compress-utils/brotli/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
