// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LZO
import {registerJSModules, getJSModule, toBuffer} from '@loaders.gl/loader-utils';

import type {CompressionOptions} from './compression';
import {Compression} from './compression';

/**
 * Lempel-Ziv-Oberheimer compression / decompression
 */
export class LZOCompression extends Compression {
  readonly name = 'lzo';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = false;
  readonly options: CompressionOptions;

  /**
   * lzo is an injectable dependency due to big size
   * @param options
   */
  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;
    registerJSModules(options?.modules);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    const lzo = getJSModule('lzo', this.name);
    const inputBuffer = toBuffer(input);
    return lzo.compress(inputBuffer).buffer;
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    const lzo = getJSModule('lzo', this.name);
    const inputBuffer = toBuffer(input);
    return lzo.decompress(inputBuffer).buffer;
  }
}
