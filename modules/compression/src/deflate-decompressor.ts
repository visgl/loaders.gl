// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DeflateCompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './deflate-decompressor-compress-utils';

import {
  decompressWithNativeDecompressionStream,
  decompressBatchesWithNativeDecompressionStream
} from './lib/decompression-stream';

/** Default DEFLATE decompressor backed by the lazily loaded compress-utils codec. */
export class DeflateDecompressor extends DeflateCompressUtilsDecompressor {
  /** Decompresses with native streams when available, otherwise lazily initializes WASM. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(
        input,
        this.options.raw ? 'deflate-raw' : 'deflate'
      );
      if (output) return output;
    }
    return super.decompress(input, size);
  }

  /** Streams native batches when available, otherwise uses the WASM stream. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = decompressBatchesWithNativeDecompressionStream(
        inputBatches,
        this.options.raw ? 'deflate-raw' : 'deflate'
      );
      if (output) {
        yield* output;
        return;
      }
    }
    yield* super.decompressBatches(inputBatches);
  }
}

export type {CompressUtilsCompressionOptions as DeflateDecompressorOptions};
