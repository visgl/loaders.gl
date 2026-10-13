// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GZipCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './gzip-compressor-compress-utils';

import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './lib/compression-stream';

/** Default GZIP compressor backed by the lazily loaded compress-utils codec. */
export class GZipCompressor extends GZipCompressUtilsCompressor {
  /** Compresses with native streams when available, otherwise lazily initializes WASM. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'gzip');
      if (output) return output;
    }
    return super.compress(input);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
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

export type {CompressUtilsCompressionOptions as GZipCompressorOptions};
