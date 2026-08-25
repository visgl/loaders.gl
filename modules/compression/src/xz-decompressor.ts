// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  XZCompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './xz-decompressor-compress-utils';

/** Balanced default XZ/LZMA decompressor using the lazy compress-utils implementation. */
export class XZDecompressor extends XZCompressUtilsDecompressor {}

export type {CompressUtilsCompressionOptions as XZDecompressorOptions};
