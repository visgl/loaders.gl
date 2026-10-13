// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BrotliCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './brotli-compressor-compress-utils';

import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './lib/compression-stream';

/** Default BROTLI compressor backed by the lazily loaded compress-utils codec. */
export class BrotliCompressor extends BrotliCompressUtilsCompressor {
  /** Compresses with native streams when available, otherwise lazily initializes WASM. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'brotli');
      if (output) return output;
    }
    return super.compress(input);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = compressBatchesWithNativeCompressionStream(inputBatches, 'brotli');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.compressBatches(inputBatches);
  }
}

export type {CompressUtilsCompressionOptions as BrotliCompressorOptions};
