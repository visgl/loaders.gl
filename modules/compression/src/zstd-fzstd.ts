// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compression, type CompressionOptions} from './lib/compression';
import {decompress} from 'fzstd';

/**
 * Zstandard decompression explicitly backed by the compact fzstd decoder.
 * @deprecated Use `ZstdFzstdDecompressor` from `zstd-decompressor-fzstd`.
 */
export class ZstdFzstdCompression extends Compression {
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

export type {CompressionOptions as ZstdFzstdCompressionOptions};
