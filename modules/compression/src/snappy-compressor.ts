// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  SnappyCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './snappy-compressor-compress-utils';

/** Default SNAPPY compressor backed by the lazily loaded compress-utils codec. */
export class SnappyCompressor extends SnappyCompressUtilsCompressor {}

export type {CompressUtilsCompressionOptions as SnappyCompressorOptions};
