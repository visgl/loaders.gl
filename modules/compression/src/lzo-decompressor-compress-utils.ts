// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions,
  type CompressUtilsDecompressModule
} from './lib/compress-utils-compression';

/** Decoder-only raw LZO1X binding. Atomic calls require output capacity. */
export class LzoCompressUtilsDecompressor extends CompressUtilsDecompressor {
  /** Creates a lazy decoder; neither an encoder nor container framing is included. */
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'lzo'},
      async () =>
        (await import('compress-utils/lzo/decompress')) as unknown as CompressUtilsDecompressModule,
      options
    );
  }

  /** Decodes a bounded atomic block after preload(). */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    return super.decompressSync(input, this.requireCapacity(size));
  }

  /** Decodes a bounded atomic block, initializing the backend automatically. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    return super.decompress(input, this.requireCapacity(size));
  }

  /** Prevents the backend from allocating inferred-size output before validation. */
  private requireCapacity(size?: number): number {
    const capacity = size ?? this.options.compressUtils?.expectedSize;
    if (capacity === undefined) throw new RangeError('LZO atomic decoding requires expectedSize');
    return capacity as number;
  }
}

export type {CompressUtilsCompressionOptions as LzoDecompressorOptions};
