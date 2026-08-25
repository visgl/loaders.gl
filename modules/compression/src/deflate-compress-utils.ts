// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * Zlib-wrapped DEFLATE compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class DeflateCompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'deflate', contentEncodings: ['deflate']},
      () => import('compress-utils/zlib/compress'),
      () => import('compress-utils/zlib/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
