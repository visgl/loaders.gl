// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeflateCompression, type DeflateCompressionOptions} from './lib/deflate-compression';

/**
 * DEFLATE compression explicitly backed by fflate.
 * @deprecated Import `deflate-compressor-fflate` and/or `deflate-decompressor-fflate`.
 */
export class DeflateFflateCompression extends DeflateCompression {
  constructor(options: DeflateCompressionOptions = {}) {
    super({...options, deflate: {...options.deflate, useNative: false}});
  }
}

export type {DeflateCompressionOptions as DeflateFflateCompressionOptions};
