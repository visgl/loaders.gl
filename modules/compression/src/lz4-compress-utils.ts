// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompression,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/**
 * LZ4 frame compression backed by the optional compress-utils package.
 * @deprecated Use the direction-specific compress-utils compressor or decompressor.
 */
export class LZ4CompressUtilsCompression extends CompressUtilsCompression {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'lz4', extensions: ['lz4'], contentEncodings: ['x-lz4']},
      () => import('compress-utils/lz4/compress'),
      () => import('compress-utils/lz4/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
