// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DeflateFflateDecompressor,
  type DeflateFflateDecompressorOptions
} from './deflate-decompressor-fflate';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from './lib/decompression-stream';

/** Options for the balanced default DEFLATE decompressor. */
export type DeflateDecompressorOptions = DeflateFflateDecompressorOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first DEFLATE decompressor with a compact fflate fallback. */
export class DeflateDecompressor extends DeflateFflateDecompressor {
  declare readonly options: DeflateDecompressorOptions;

  constructor(options: DeflateDecompressorOptions = {}) {
    super(options);
  }

  /** Decompresses with the built-in stream when available, then falls back to fflate. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const format = this.options.raw ? 'deflate-raw' : 'deflate';
      const output = await decompressWithNativeDecompressionStream(input, format);
      if (output) return output;
    }
    return this.decompressSync(input);
  }

  /** Decompresses batches with a built-in or fflate stream. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const format = this.options.raw ? 'deflate-raw' : 'deflate';
      const output = decompressBatchesWithNativeDecompressionStream(inputBatches, format);
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.decompressBatches(inputBatches);
  }
}
