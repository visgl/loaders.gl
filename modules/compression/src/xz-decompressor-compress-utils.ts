// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** XZ/LZMA decompressor backed only by the compress-utils decoder chunk. */
export class XZCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'xz', extensions: ['xz', 'lzma'], contentEncodings: ['xz']},
      () => import('compress-utils/xz/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
