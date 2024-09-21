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
import {BrotliDecode} from '../brotli/decode';
import zlib from 'zlib';

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
 */
export class BrotliCompression extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;
  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions) {
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
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // On Node.js we can use built-in zlib
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
    return outputArray.buffer;
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = await promisify1(zlib.brotliDecompress)(input);
      return toArrayBuffer(buffer);
    }
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
      return outputArray.buffer;
    }
    const outputArray = BrotliDecode(inputArray, undefined);
    return outputArray.buffer;
  }
}
