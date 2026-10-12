// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DeflateCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './deflate-compressor-compress-utils';

import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './lib/compression-stream';

/** Default DEFLATE compressor backed by the lazily loaded compress-utils codec. */
export class DeflateCompressor extends DeflateCompressUtilsCompressor {
  /** Compresses with native streams when available, otherwise lazily initializes WASM. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false && !this.options.raw) {
      const output = await compressWithNativeCompressionStream(input, 'deflate');
      if (output) return output;
    }
    return super.compress(input);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false && !this.options.raw) {
      const output = compressBatchesWithNativeCompressionStream(inputBatches, 'deflate');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.compressBatches(inputBatches);
  }
}

export type {CompressUtilsCompressionOptions as DeflateCompressorOptions};
