// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lib/compress-utils-compression';

/** Snappy decompressor backed only by the compress-utils decoder chunk. */
export class SnappyCompressUtilsDecompressor extends CompressUtilsDecompressor {
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super({name: 'snappy'}, () => import('compress-utils/snappy/decompress'), options);
  }
}

export type {CompressUtilsCompressionOptions};
