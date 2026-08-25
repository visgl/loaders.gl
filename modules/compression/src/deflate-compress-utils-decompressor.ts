// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Zlib-wrapped DEFLATE decompressor backed only by the compress-utils decoder chunk. */
export class DeflateCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'deflate', contentEncodings: ['deflate']},
      () => import('compress-utils/zlib/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
