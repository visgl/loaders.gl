// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Snappy compressor backed only by the compress-utils encoder chunk. */
export class SnappyCompressUtilsCompressor extends CompressUtilsCompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super({name: 'snappy'}, () => import('compress-utils/snappy/compress'), options);
  }
}

export type {CompressUtilsCompressionOptions};
