// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BZip2CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './bzip2-decompressor-compress-utils';

/** Balanced default bzip2 decompressor using the lazy compress-utils implementation. */
export class BZip2Decompressor extends BZip2CompressUtilsDecompressor {}

export type {CompressUtilsCompressionOptions as BZip2DecompressorOptions};
