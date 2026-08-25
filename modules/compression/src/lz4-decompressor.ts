// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {LZ4Compression} from './lib/lz4-compression';

/** Default LZ4 decompressor for frames, raw blocks, and Hadoop-framed blocks. */
export class LZ4Decompressor extends Decompressor {
  readonly name = 'lz4';
  readonly extensions = ['lz4'];
  readonly contentEncodings = ['x-lz4'];
  readonly isSupported = true;

  private readonly implementation: LZ4Compression;

  constructor(options: CompressionOptions = {}) {
    super(options);
    this.implementation = new LZ4Compression(options);
  }

  /** Preloads lz4js for frame decoding; block decoding does not require it. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    await this.implementation.preload(modules);
  }

  /** Decompresses an LZ4 frame or block. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    return this.implementation.decompress(input, size);
  }

  /** Decompresses an LZ4 frame or block synchronously. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    return this.implementation.decompressSync(input, size);
  }
}

export type {CompressionOptions as LZ4DecompressorOptions};
