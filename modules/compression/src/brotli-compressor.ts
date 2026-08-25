// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BrotliCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './brotli-compressor-compress-utils';
import {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './lib/compression-stream';
import {getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';
import type {BrotliCompression, BrotliCompressionOptions} from './lib/brotli-compression';

/** Options for the balanced default Brotli compressor. */
export type BrotliCompressorOptions = CompressUtilsCompressionOptions &
  BrotliCompressionOptions & {
    /** Whether asynchronous methods may use the built-in stream implementation. */
    useNative?: boolean;
  };

/** Native-first Brotli compressor with a lazy compress-utils fallback. */
export class BrotliCompressor extends BrotliCompressUtilsCompressor {
  declare readonly options: BrotliCompressorOptions;
  private compatibility: BrotliCompression | null = null;

  constructor(options: BrotliCompressorOptions = {}) {
    super(options);
    registerJSModules(options.modules);
  }

  /** Preloads an injected Brotli implementation when supplied. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (getJSModuleOrNull('brotli') || this.options.brotli?.useZlib) {
      const {BrotliCompression} = await import('./lib/brotli-compression');
      this.compatibility ||= new BrotliCompression(this.options);
      await this.compatibility.preload(modules);
    }
  }

  /** Compresses with the built-in stream when available, then falls back to compress-utils. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'brotli');
      if (output) return output;
    }
    if (getJSModuleOrNull('brotli') || this.options.brotli?.useZlib) {
      await this.preload(this.options.modules);
      return this.compatibility!.compressSync(input);
    }
    return super.compress(input);
  }

  /** Compresses synchronously with a preloaded injected or Node zlib implementation. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!this.compatibility) {
      throw new Error('brotli: call preload() with an encoder before synchronous compression');
    }
    return this.compatibility.compressSync(input);
  }

  /** Compresses batches with a built-in or compress-utils stream. */
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
    if (getJSModuleOrNull('brotli') || this.options.brotli?.useZlib) {
      yield this.compress(await this.concatenate(inputBatches));
      return;
    }
    yield* super.compressBatches(inputBatches);
  }
}
