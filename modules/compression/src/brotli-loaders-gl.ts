// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BrotliCompression, type BrotliCompressionOptions} from './lib/brotli-compression';
import {BrotliDecode} from './brotli-decode';

/**
 * Brotli decompression backed by the loaders.gl JavaScript decoder.
 * @deprecated Import `BrotliLoadersGLDecompressor` from `brotli-loaders-gl-decompressor`.
 */
export class BrotliLoadersGLCompression extends BrotliCompression {
  constructor(options: BrotliCompressionOptions = {}) {
    super({
      ...options,
      modules: {
        ...options.modules,
        brotli: {
          compress: () => {
            throw new Error('BrotliLoadersGLCompression does not provide a Brotli encoder');
          },
          decompress: (input: Uint8Array) => BrotliDecode(input, undefined)
        }
      }
    });
  }
}

export type {BrotliCompressionOptions as BrotliLoadersGLCompressionOptions};
