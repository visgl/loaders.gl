// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompressionOptions} from './compression';
import {Compression} from './compression';

/** Options for the bzip2 decompressor. */
export type BZip2CompressionOptions = CompressionOptions;

/**
 * Compact bzip2 compression and decompression compatibility facade.
 * @deprecated Import a direction-specific bzip2 compressor or decompressor.
 */
export class BZip2Compression extends Compression {
  readonly name = 'bzip2';
  readonly extensions = ['bz2'];
  readonly contentEncodings = ['bzip2'];
  readonly isSupported = true;
  readonly options: BZip2CompressionOptions;

  constructor(options: BZip2CompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses a bzip2 stream. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    let decompress: (input: Uint8Array) => Promise<Uint8Array>;
    try {
      ({decompress} = await import('compress-utils/bz2/decompress'));
    } catch (error) {
      throw new Error(
        'BZip2Compression requires the optional compress-utils package. ' +
          'Install compress-utils to decode bzip2 data.',
        {cause: error}
      );
    }
    const output = await decompress(new Uint8Array(input));
    return output.slice().buffer as ArrayBuffer;
  }

  /** Compresses a bzip2 stream. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    let compress: (input: Uint8Array) => Promise<Uint8Array>;
    try {
      ({compress} = await import('compress-utils/bz2/compress'));
    } catch (error) {
      throw new Error(
        'BZip2Compression requires the optional compress-utils package. ' +
          'Install compress-utils to encode bzip2 data.',
        {cause: error}
      );
    }
    const output = await compress(new Uint8Array(input));
    return output.slice().buffer as ArrayBuffer;
  }
}
