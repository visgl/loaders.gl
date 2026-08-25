// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compressor, type CompressionOptions} from './lib/compression';

/** Pass-through compressor for uncompressed data. */
export class NoCompressor extends Compressor {
  readonly name = 'uncompressed';
  readonly extensions: string[] = [];
  readonly contentEncodings: string[] = [];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Returns the input without modification. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

export type {CompressionOptions as NoCompressorOptions};
