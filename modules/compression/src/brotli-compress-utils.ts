// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * Brotli compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class BrotliCompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'brotli', extensions: ['br'], contentEncodings: ['br']},
      () => import('compress-utils/brotli/compress'),
      () => import('compress-utils/brotli/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
