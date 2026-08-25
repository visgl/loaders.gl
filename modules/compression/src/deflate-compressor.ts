// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DeflateFflateCompressor,
  type DeflateFflateCompressorOptions
} from './deflate-compressor-fflate';
import {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './lib/compression-stream';

/** Options for the balanced default DEFLATE compressor. */
export type DeflateCompressorOptions = DeflateFflateCompressorOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first DEFLATE compressor with a compact fflate fallback. */
export class DeflateCompressor extends DeflateFflateCompressor {
  declare readonly options: DeflateCompressorOptions;

  constructor(options: DeflateCompressorOptions = {}) {
    super(options);
  }

  /** Compresses with the built-in stream when available, then falls back to fflate. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.options.raw && this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'deflate');
      if (output) return output;
    }
    return this.compressSync(input);
  }

  /** Compresses batches with a built-in or fflate stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (!this.options.raw && this.options.useNative !== false) {
      const output = compressBatchesWithNativeCompressionStream(inputBatches, 'deflate');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.compressBatches(inputBatches);
  }
}
