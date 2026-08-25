// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** XZ/LZMA compressor backed only by the compress-utils encoder chunk. */
export class XZCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'xz', extensions: ['xz', 'lzma'], contentEncodings: ['xz']},
      () => import('compress-utils/xz/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
