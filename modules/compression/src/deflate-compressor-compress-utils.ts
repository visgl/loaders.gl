// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Zlib-wrapped DEFLATE compressor backed only by the compress-utils encoder chunk. */
export class DeflateCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'deflate', contentEncodings: ['deflate']},
      () => import('compress-utils/zlib/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
