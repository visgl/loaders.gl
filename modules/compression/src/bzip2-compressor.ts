// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BZip2CompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './bzip2-compressor-compress-utils';

/** Balanced default bzip2 compressor using the lazy compress-utils implementation. */
export class BZip2Compressor extends BZip2CompressUtilsCompressor {}

export type {CompressUtilsCompressionOptions as BZip2CompressorOptions};
