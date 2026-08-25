// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** LZ4 frame decompressor backed only by the compress-utils decoder chunk. */
export class LZ4CompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'lz4', extensions: ['lz4'], contentEncodings: ['x-lz4']},
      () => import('compress-utils/lz4/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
