// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// SNAPPY (aka ZIPPY)
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {getJSModule, getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

/**
 * Snappy/zippy compression / decompression
 * @deprecated Import a direction-specific Snappy compressor or decompressor.
 */
export class SnappyCompression extends Compression {
  readonly name: string = 'snappy';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  constructor(options?: CompressionOptions) {
    super(options);
    this.options = options || {};
    registerJSModules(this.options.modules);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const snappy = getJSModule<any>('snappyjs', this.name);
    return snappy.compress(input);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const snappy = getJSModule<any>('snappyjs', this.name);
    return snappy.uncompress(input);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (!getJSModuleOrNull('snappyjs')) {
      const snappy = await import('snappyjs');
      registerJSModules({snappyjs: snappy.default || snappy});
    }
  }
}
