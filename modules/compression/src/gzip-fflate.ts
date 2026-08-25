// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GZipCompression, type GZipCompressionOptions} from './lib/gzip-compression';

/**
 * GZIP compression explicitly backed by fflate.
 * @deprecated Import `gzip-fflate-compressor` and/or `gzip-fflate-decompressor`.
 */
export class GZipFflateCompression extends GZipCompression {
  constructor(options: GZipCompressionOptions = {}) {
    super({...options, useNative: false});
  }
}

export type {GZipCompressionOptions as GZipFflateCompressionOptions};
