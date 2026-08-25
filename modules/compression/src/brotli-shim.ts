// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BrotliCompression, type BrotliCompressionOptions} from './lib/brotli-compression';
import {BrotliDecode} from './brotli-decode';

/**
 * Brotli decompression backed by the bundled JavaScript decoder shim.
 * @deprecated Import `BrotliShimDecompressor` from `brotli-decompressor-shim`.
 */
export class BrotliShimCompression extends BrotliCompression {
  constructor(options: BrotliCompressionOptions = {}) {
    super({
      ...options,
      modules: {
        ...options.modules,
        brotli: {
          compress: () => {
            throw new Error('BrotliShimCompression does not provide a Brotli encoder');
          },
          decompress: (input: Uint8Array) => BrotliDecode(input, undefined)
        }
      }
    });
  }
}

export type {BrotliCompressionOptions as BrotliShimCompressionOptions};
