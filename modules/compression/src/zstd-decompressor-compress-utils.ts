// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Zstandard decompressor backed only by the compress-utils decoder chunk. */
export class ZstdCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'zstd', extensions: ['zst'], contentEncodings: ['zstd']},
      () => import('compress-utils/zstd/decompress'),
      options
    );
  }
}

export type {CompressUtilsCompressionOptions};
