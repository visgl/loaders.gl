// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** bzip2 compressor backed only by the compress-utils encoder chunk. */
export class BZip2CompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'bzip2', extensions: ['bz2'], contentEncodings: ['bzip2']},
      () => import('compress-utils/bz2/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
