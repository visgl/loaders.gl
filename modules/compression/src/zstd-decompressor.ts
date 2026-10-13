// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ZstdCompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './zstd-decompressor-compress-utils';

import {
  decompressWithNativeDecompressionStream,
  decompressBatchesWithNativeDecompressionStream
} from './lib/decompression-stream';

/** Default ZSTD decompressor backed by the lazily loaded compress-utils codec. */
export class ZstdDecompressor extends ZstdCompressUtilsDecompressor {
  /** Decompresses with native streams when available, otherwise lazily initializes WASM. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(input, 'zstd');
      if (output) return output;
    }
    return super.decompress(input, size);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = decompressBatchesWithNativeDecompressionStream(inputBatches, 'zstd');
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.decompressBatches(inputBatches);
  }
}

export type {CompressUtilsCompressionOptions as ZstdDecompressorOptions};
