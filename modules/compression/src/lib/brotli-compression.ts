// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// BROTLI
import {
  isBrowser,
  registerJSModules,
  getJSModuleOrNull,
  toArrayBuffer
} from '@loaders.gl/loader-utils';

import {Compression} from './compression';
import {BrotliCompressionZlib} from './brotli-compression-zlib';
import type {BrotliCompressionZlibOptions} from './brotli-compression-zlib';
import {BrotliDecode} from '../brotli/decode';

export type BrotliCompressionOptions = BrotliCompressionZlibOptions & {
  brotli?: Record<string, any>;
};

type BrotliModule = {
  decompress?: (input: Uint8Array, options?: Record<string, any>) => any;
  compress?: (input: Uint8Array, options?: Record<string, any>) => any;
};

/**
 * Brotli decompression (compression is supported via `BrotliCompressionZlib` on Node.js)
 */
export class BrotliCompression extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  get isSupported(): boolean {
    return true;
  }
  get isCompressionSupported(): boolean {
    return false;
  }

  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions = {}) {
    super(options);
    this.options = options;

    registerJSModules(options?.modules);

    if (!isBrowser && this.options.useZlib) {
      // @ts-ignore public API is equivalent
      return new BrotliCompressionZlib(options);
    }
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
  }

  compressSync(_input: ArrayBuffer): ArrayBuffer {
    throw new Error(
      `${this.name}: compression not supported (use BrotliCompressionZlib on Node.js)`
    );
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const inputArray = new Uint8Array(input);
    const brotliOptions = this.options?.brotli || {};

    const brotliModule = getJSModuleOrNull<any>('brotli');
    if (typeof brotliModule === 'function') {
      return toArrayBuffer(brotliModule(inputArray, brotliOptions));
    }
    if (brotliModule && (brotliModule as BrotliModule).decompress) {
      return toArrayBuffer((brotliModule as BrotliModule).decompress!(inputArray, brotliOptions));
    }

    return toArrayBuffer(BrotliDecode(inputArray as any, undefined));
  }
}
