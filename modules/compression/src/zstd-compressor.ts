// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ZstdCompressUtilsCompressor,
  type CompressUtilsCompressionOptions
} from './zstd-compressor-compress-utils';
import {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream
} from './lib/compression-stream';
import {getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';
import type {ZstdCompression} from './lib/zstd-compression';

/** Options for the balanced default Zstandard compressor. */
export type ZstdCompressorOptions = CompressUtilsCompressionOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first Zstandard compressor with a lazy compress-utils fallback. */
export class ZstdCompressor extends ZstdCompressUtilsCompressor {
  declare readonly options: ZstdCompressorOptions;
  private compatibility: ZstdCompression | null = null;

  constructor(options: ZstdCompressorOptions = {}) {
    super(options);
    registerJSModules(options.modules);
  }

  /** Preloads an injected zstd-codec implementation when supplied. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (getJSModuleOrNull('zstd-codec')) {
      const {ZstdCompression} = await import('./lib/zstd-compression');
      this.compatibility ||= new ZstdCompression(this.options);
      await this.compatibility.preload(modules);
    }
  }

  /** Compresses with the built-in stream when available, then falls back to compress-utils. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await compressWithNativeCompressionStream(input, 'zstd');
      if (output) return output;
    }
    if (getJSModuleOrNull('zstd-codec')) {
      await this.preload(this.options.modules);
      return this.compatibility!.compressSync(input);
    }
    return super.compress(input);
  }

  /** Compresses synchronously with a preloaded injected zstd-codec implementation. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!this.compatibility) {
      throw new Error('zstd: call preload() with zstd-codec before synchronous compression');
    }
    return this.compatibility.compressSync(input);
  }

  /** Compresses batches with a built-in or compress-utils stream. */
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
    if (getJSModuleOrNull('zstd-codec')) {
      yield this.compress(await this.concatenate(inputBatches));
      return;
    }
    yield* super.compressBatches(inputBatches);
  }
}
