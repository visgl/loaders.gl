// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compressor, type CompressionOptions} from './lib/compression';
import {getJSModule, getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

type LZ4JS = {compress(input: Uint8Array): Uint8Array};

/** LZ4 frame compressor backed by lz4js. */
export class LZ4JSCompressor extends Compressor {
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

  /** Compresses one LZ4 frame synchronously after preload. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return getJSModule<LZ4JS>('lz4js', this.name).compress(new Uint8Array(input)).slice()
      .buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as LZ4JSCompressorOptions};
