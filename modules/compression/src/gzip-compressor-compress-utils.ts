// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** GZIP compressor backed only by the compress-utils encoder chunk. */
export class GZipCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'gzip', extensions: ['gz', 'gzip'], contentEncodings: ['gzip', 'x-gzip']},
      () => import('compress-utils/gzip/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
