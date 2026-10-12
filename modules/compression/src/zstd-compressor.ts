// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ZstdCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './zstd-compressor-compress-utils';

import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './lib/compression-stream';

/** Default ZSTD compressor backed by the lazily loaded compress-utils codec. */
export class ZstdCompressor extends ZstdCompressUtilsCompressor {
  /** Compresses with native streams when available, otherwise lazily initializes WASM. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'zstd');
      if (output) return output;
    }
    return super.compress(input);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = compressBatchesWithNativeCompressionStream(inputBatches, 'zstd');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.compressBatches(inputBatches);
  }
}

export type {CompressUtilsCompressionOptions as ZstdCompressorOptions};
