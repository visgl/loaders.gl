// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** bzip2 decompressor backed only by the compress-utils decoder chunk. */
export class BZip2CompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'bzip2', extensions: ['bz2'], contentEncodings: ['bzip2']},
      () => import('compress-utils/bz2/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
