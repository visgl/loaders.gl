// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compressor, type CompressionOptions} from './lib/compression';
import {getJSModule, getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

type SnappyJS = {compress(input: ArrayBuffer): ArrayBuffer};

/** Snappy compressor backed by the compact snappyjs implementation. */
export class SnappyJSCompressor extends Compressor {
  readonly name = 'snappy';
  readonly extensions: string[] = [];
  readonly contentEncodings: string[] = [];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
    registerJSModules(options.modules);
  }

  /** Loads snappyjs when it has not been injected. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (!getJSModuleOrNull('snappyjs')) {
      const snappy = await import('snappyjs');
      registerJSModules({snappyjs: snappy.default || snappy});
    }
  }

  /** Compresses one Snappy payload synchronously after preload. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return getJSModule<SnappyJS>('snappyjs', this.name).compress(input);
  }
}

export type {CompressionOptions as SnappyJSCompressorOptions};
