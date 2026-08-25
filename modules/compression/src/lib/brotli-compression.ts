// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// BROTLI
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {
  isBrowser,
  toArrayBuffer,
  registerJSModules,
  getJSModule,
  getJSModuleOrNull,
  promisify1
} from '@loaders.gl/loader-utils';

import type brotliNamespace from 'brotli';
// import brotli from 'brotli';  // https://bundlephobia.com/package/brotli
import zlib from 'zlib';
import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './compression-stream';
import {
  decompressWithNativeDecompressionStream,
  decompressBatchesWithNativeDecompressionStream
} from './decompression-stream';

export type BrotliCompressionOptions = CompressionOptions & {
  brotli?: {
    mode?: number;
    quality?: number;
    lgwin?: number;
    useZlib?: boolean;
  };
};

const DEFAULT_BROTLI_OPTIONS = {
  brotli: {
    mode: 0,
    quality: 8,
    lgwin: 22
  }
};

type Brotli = typeof brotliNamespace;

/**
 * brotli compression / decompression
 * @deprecated Import a direction-specific Brotli compressor or decompressor.
 */
export class BrotliCompression extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;
  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions = {}) {
    super(options);
    this.options = options;
    registerJSModules(options?.modules);
  }

  /**
   * brotli is an injectable dependency due to big size
   * @param options
   */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (!getJSModuleOrNull('brotli')) {
      const {BrotliDecode} = await import('../brotli-decode');
      registerJSModules({
        brotli: {
          compress: () => {
            throw new Error('Brotli compression requires an injected encoder');
          },
          decompress: (input: Uint8Array) => BrotliDecode(input, undefined)
        }
      });
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const nativeOutput = await compressWithNativeCompressionStream(input, 'brotli');
    if (nativeOutput) return nativeOutput;
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = await promisify1(zlib.brotliCompress)(input);
      return toArrayBuffer(buffer);
    }
    return this.compressSync(input);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = zlib.brotliCompressSync(input);
      return toArrayBuffer(buffer);
    }
    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);

    const brotli = getJSModule<Brotli>('brotli', this.name);
    // @ts-ignore brotli types state that only Buffers are accepted...
    const outputArray = brotli.compress(inputArray, brotliOptions);
    if (!outputArray) {
      throw new Error('Brotli compression failed');
    }
    return toArrayBuffer(outputArray.buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (!getJSModuleOrNull('brotli')) {
      const nativeOutput = await decompressWithNativeDecompressionStream(input, 'brotli');
      if (nativeOutput) return nativeOutput;
    }
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = await promisify1(zlib.brotliDecompress)(input);
      return toArrayBuffer(buffer);
    }
    await this.preload();
    return this.decompressSync(input);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = zlib.brotliDecompressSync(input);
      return toArrayBuffer(buffer);
    }

    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);

    const brotli = getJSModuleOrNull<Brotli>('brotli');
    if (brotli) {
      // @ts-ignore brotli types state that only Buffers are accepted...
      const outputArray = brotli.decompress(inputArray, brotliOptions);
      return toArrayBuffer(outputArray.buffer);
    }
    throw new Error(`${this.name}: synchronous fallback is unavailable; preload a brotli module`);
  }

  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const nativeBatches = decompressBatchesWithNativeDecompressionStream(inputBatches, 'brotli');
    if (nativeBatches) {
      yield* nativeBatches;
      return;
    }
    yield this.decompress(await this.concatenate(inputBatches));
  }

  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const nativeBatches = compressBatchesWithNativeCompressionStream(inputBatches, 'brotli');
    if (nativeBatches) {
      yield* nativeBatches;
      return;
    }
    yield this.compress(await this.concatenate(inputBatches));
  }
}
