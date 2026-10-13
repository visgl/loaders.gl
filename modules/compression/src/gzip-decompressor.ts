// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GZipCompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './gzip-decompressor-compress-utils';

import {
  decompressWithNativeDecompressionStream,
  decompressBatchesWithNativeDecompressionStream
} from './lib/decompression-stream';

/** Default GZIP decompressor backed by the lazily loaded compress-utils codec. */
export class GZipDecompressor extends GZipCompressUtilsDecompressor {
  /** Decompresses with native streams when available, otherwise lazily initializes WASM. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(input, 'gzip');
      if (output) return output;
    }
    return super.decompress(input, size);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
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

export type {CompressUtilsCompressionOptions as GZipDecompressorOptions};
