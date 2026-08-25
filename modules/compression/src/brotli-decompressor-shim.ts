// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {BrotliDecode} from './brotli-decode';

/** Brotli decompressor backed by the bundled JavaScript decoder shim. */
export class BrotliShimDecompressor extends Decompressor {
  readonly name = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Decompresses one Brotli payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return BrotliDecode(new Uint8Array(input), undefined).slice().buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as BrotliShimDecompressorOptions};
