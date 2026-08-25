// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * GZIP compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class GZipCompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'gzip', extensions: ['gz', 'gzip'], contentEncodings: ['gzip', 'x-gzip']},
      () => import('compress-utils/gzip/compress'),
      () => import('compress-utils/gzip/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
