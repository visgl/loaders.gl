// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  LZ4CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './lz4-compressor-compress-utils';

/** Default LZ4 compressor backed by the lazily loaded compress-utils codec. */
export class LZ4Compressor extends LZ4CompressUtilsCompressor {}

export type {CompressUtilsCompressionOptions as LZ4CompressorOptions};
