// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * bzip2 compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class BZip2CompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'bzip2', extensions: ['bz2'], contentEncodings: ['bzip2']},
      () => import('compress-utils/bz2/compress'),
      () => import('compress-utils/bz2/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
