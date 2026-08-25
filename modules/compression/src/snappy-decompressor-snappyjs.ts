// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {getJSModule, getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

type SnappyJS = {uncompress(input: ArrayBuffer): ArrayBuffer};

/** Snappy decompressor backed by the compact snappyjs implementation. */
export class SnappyJSDecompressor extends Decompressor {
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

  /** Decompresses one Snappy payload synchronously after preload. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return getJSModule<SnappyJS>('snappyjs', this.name).uncompress(input);
  }
}

export type {CompressionOptions as SnappyJSDecompressorOptions};
