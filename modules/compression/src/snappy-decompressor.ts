// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  SnappyCompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './snappy-decompressor-compress-utils';

/** Default SNAPPY decompressor backed by the lazily loaded compress-utils codec. */
export class SnappyDecompressor extends SnappyCompressUtilsDecompressor {}

export type {CompressUtilsCompressionOptions as SnappyDecompressorOptions};
