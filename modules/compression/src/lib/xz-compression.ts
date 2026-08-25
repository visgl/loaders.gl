// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompressionOptions} from './compression';
import {Compression} from './compression';

/** Options for the XZ decompressor. */
export type XZCompressionOptions = CompressionOptions;

/**
 * Compact XZ/LZMA compression and decompression compatibility facade.
 * @deprecated Import a direction-specific XZ compressor or decompressor.
 */
export class XZCompression extends Compression {
  readonly name = 'xz';
  readonly extensions = ['xz', 'lzma'];
  readonly contentEncodings = ['xz'];
  readonly isSupported = true;
  readonly options: XZCompressionOptions;

  constructor(options: XZCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses an XZ stream. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    let decompress: (input: Uint8Array) => Promise<Uint8Array>;
    try {
      ({decompress} = await import('compress-utils/xz/decompress'));
    } catch (error) {
      throw new Error(
        'XZCompression requires the optional compress-utils package. ' +
          'Install compress-utils to decode XZ data.',
        {cause: error}
      );
    }
    const output = await decompress(new Uint8Array(input));
    return output.slice().buffer as ArrayBuffer;
  }

  /** Compresses an XZ stream. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    let compress: (input: Uint8Array) => Promise<Uint8Array>;
    try {
      ({compress} = await import('compress-utils/xz/compress'));
    } catch (error) {
      throw new Error(
        'XZCompression requires the optional compress-utils package. ' +
          'Install compress-utils to encode XZ data.',
        {cause: error}
      );
    }
    const output = await compress(new Uint8Array(input));
    return output.slice().buffer as ArrayBuffer;
  }
}
