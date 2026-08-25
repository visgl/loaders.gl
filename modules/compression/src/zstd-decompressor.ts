// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZstdFzstdDecompressor, type ZstdFzstdDecompressorOptions} from './zstd-decompressor-fzstd';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from './lib/decompression-stream';
import {getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';
import type {ZstdCompression} from './lib/zstd-compression';

/** Options for the balanced default Zstandard decompressor. */
export type ZstdDecompressorOptions = ZstdFzstdDecompressorOptions & {
  /** Whether asynchronous methods may use the built-in stream implementation. */
  useNative?: boolean;
};

/** Native-first Zstandard decompressor with a compact fzstd fallback. */
export class ZstdDecompressor extends ZstdFzstdDecompressor {
  readonly options: ZstdDecompressorOptions;
  private compatibility: ZstdCompression | null = null;

  constructor(options: ZstdDecompressorOptions = {}) {
    super(options);
    this.options = options;
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

  /** Decompresses with the built-in stream when available, then falls back to fzstd. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false) {
      const output = await decompressWithNativeDecompressionStream(input, 'zstd');
      if (output) return output;
    }
    if (getJSModuleOrNull('zstd-codec')) {
      await this.preload(this.options.modules);
    }
    return this.decompressSync(input);
  }

  /** Decompresses with a preloaded zstd-codec implementation or compact fzstd. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    if (this.compatibility) {
      return this.compatibility.decompressSync(input);
    }
    if (getJSModuleOrNull('zstd-codec')) {
      throw new Error('zstd: call preload() before synchronous decompression with zstd-codec');
    }
    return super.decompressSync(input);
  }

  /** Decompresses batches with a built-in stream or compact fzstd fallback. */
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
    if (getJSModuleOrNull('zstd-codec')) {
      yield this.decompress(await this.concatenate(inputBatches));
      return;
    }
    yield* super.decompressBatches(inputBatches);
  }
}
