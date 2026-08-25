// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Brotli decompressor backed only by the compress-utils decoder chunk. */
export class BrotliCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'brotli', extensions: ['br'], contentEncodings: ['br']},
      () => import('compress-utils/brotli/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
