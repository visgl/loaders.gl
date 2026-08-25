// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** GZIP decompressor backed only by the compress-utils decoder chunk. */
export class GZipCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'gzip', extensions: ['gz', 'gzip'], contentEncodings: ['gzip', 'x-gzip']},
      () => import('compress-utils/gzip/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
