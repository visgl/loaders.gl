// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GZipFflateDecompressor,
  type GZipFflateDecompressorOptions
} from './gzip-decompressor-fflate';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from './lib/decompression-stream';

/** Options for the balanced default GZIP decompressor. */
export type GZipDecompressorOptions = GZipFflateDecompressorOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first GZIP decompressor with a compact fflate fallback. */
export class GZipDecompressor extends GZipFflateDecompressor {
  readonly options: GZipDecompressorOptions;

  constructor(options: GZipDecompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses with the built-in stream when available, then falls back to fflate. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(input, 'gzip');
      if (output) return output;
    }
    return this.decompressSync(input);
  }

  /** Decompresses batches with a built-in or fflate stream. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = decompressBatchesWithNativeDecompressionStream(inputBatches, 'gzip');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.decompressBatches(inputBatches);
  }
}
