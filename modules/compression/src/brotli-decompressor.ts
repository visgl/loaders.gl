// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor} from './lib/compression';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from './lib/decompression-stream';
import type {BrotliCompression, BrotliCompressionOptions} from './lib/brotli-compression';

/** Options for the balanced default Brotli decompressor. */
export type BrotliDecompressorOptions = BrotliCompressionOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first Brotli decompressor with a lazy bundled JavaScript fallback. */
export class BrotliDecompressor extends Decompressor {
  readonly name = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;
  readonly options: BrotliDecompressorOptions;

  private fallback: BrotliCompression | null = null;

  constructor(options: BrotliDecompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Loads the injected or bundled JavaScript fallback. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    const fallback = await this.getFallback();
    await fallback.preload({...this.options.modules, ...modules});
  }

  /** Decompresses with the built-in stream when available, then loads the bundled fallback. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(input, 'brotli');
      if (output) return output;
    }
    const fallback = await this.getFallback();
    await fallback.preload(this.options.modules);
    return fallback.decompressSync(input);
  }

  /** Decompresses synchronously after the fallback has been preloaded. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    if (!this.fallback) {
      throw new Error('brotli: call preload() before synchronous decompression');
    }
    return this.fallback.decompressSync(input);
  }

  /** Decompresses batches with a built-in stream or the bundled fallback. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = decompressBatchesWithNativeDecompressionStream(inputBatches, 'brotli');
      if (output) {
        yield* output;
        return;
      }
    }
    yield this.decompress(await this.concatenate(inputBatches));
  }

  private async getFallback(): Promise<BrotliCompression> {
    if (!this.fallback) {
      const {BrotliCompression} = await import('./lib/brotli-compression');
      this.fallback = new BrotliCompression(this.options);
    }
    return this.fallback;
  }
}
