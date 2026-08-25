// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** LZ4 frame compressor backed only by the compress-utils encoder chunk. */
export class LZ4CompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'lz4', extensions: ['lz4'], contentEncodings: ['x-lz4']},
      () => import('compress-utils/lz4/compress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
