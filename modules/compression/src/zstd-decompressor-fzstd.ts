// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {decompress} from 'fzstd';

/** Zstandard decompressor explicitly backed by the compact fzstd decoder. */
export class ZstdFzstdDecompressor extends Decompressor {
  readonly name = 'zstd';
  readonly extensions = ['zst'];
  readonly contentEncodings = ['zstd'];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Decompresses one Zstandard frame synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return decompress(new Uint8Array(input)).slice().buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as ZstdFzstdDecompressorOptions};
