// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GZipFflateCompressor, type GZipFflateCompressorOptions} from './gzip-compressor-fflate';
import {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './lib/compression-stream';

/** Options for the balanced default GZIP compressor. */
export type GZipCompressorOptions = GZipFflateCompressorOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first GZIP compressor with a compact fflate fallback. */
export class GZipCompressor extends GZipFflateCompressor {
  declare readonly options: GZipCompressorOptions;

  constructor(options: GZipCompressorOptions = {}) {
    super(options);
  }

  /** Compresses with the built-in stream when available, then falls back to fflate. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'gzip');
      if (output) return output;
    }
    return this.compressSync(input);
  }

  /** Compresses batches with a built-in or fflate stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = compressBatchesWithNativeCompressionStream(inputBatches, 'gzip');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.compressBatches(inputBatches);
  }
}
