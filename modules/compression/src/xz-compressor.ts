// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  XZCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './xz-compressor-compress-utils';

/** Balanced default XZ/LZMA compressor using the lazy compress-utils implementation. */
export class XZCompressor extends XZCompressUtilsCompressor {}

export type {CompressUtilsCompressionOptions as XZCompressorOptions};
