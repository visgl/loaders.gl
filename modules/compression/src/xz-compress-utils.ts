// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * XZ/LZMA compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class XZCompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'xz', extensions: ['xz', 'lzma'], contentEncodings: ['xz']},
      () => import('compress-utils/xz/compress'),
      () => import('compress-utils/xz/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
