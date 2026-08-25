// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {getJSModule, getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

type LZ4JS = {decompress(input: Uint8Array, maxSize?: number): Uint8Array};

/** LZ4 frame decompressor backed by lz4js. */
export class LZ4JSDecompressor extends Decompressor {
  readonly name = 'lz4';
  readonly extensions = ['lz4'];
  readonly contentEncodings = ['x-lz4'];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
    registerJSModules(options.modules);
  }

  /** Loads lz4js when it has not been injected. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (!getJSModuleOrNull('lz4js')) {
      const lz4 = await import('lz4js');
      registerJSModules({lz4js: lz4.default || lz4});
    }
  }

  /** Decompresses one LZ4 frame synchronously after preload. */
  decompressSync(input: ArrayBuffer, maxSize?: number): ArrayBuffer {
    return getJSModule<LZ4JS>('lz4js', this.name).decompress(new Uint8Array(input), maxSize).slice()
      .buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as LZ4JSDecompressorOptions};
