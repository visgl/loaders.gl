// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';

/** Pass-through decompressor for uncompressed data. */
export class NoDecompressor extends Decompressor {
  readonly name = 'uncompressed';
  readonly extensions: string[] = [];
  readonly contentEncodings: string[] = [];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Returns the input without modification. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

export type {CompressionOptions as NoDecompressorOptions};
