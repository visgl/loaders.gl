// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Compression interface
import {concatenateArrayBuffersAsync, registerJSModules} from '@loaders.gl/loader-utils';

/** Compression options */
export type CompressionOptions = {
  // operation: 'compress' | 'decompress';
  modules?: {[moduleName: string]: any};
};

/** Compression */
export abstract class Compression {
  abstract readonly name: string;
  abstract readonly extensions: string[];
  abstract readonly contentEncodings: string[];
  abstract readonly isSupported: boolean;

  constructor(options?: CompressionOptions) {
    this.compressBatches = this.compressBatches.bind(this);
    this.decompressBatches = this.decompressBatches.bind(this);
  }

  /** Preloads any dynamic libraries. May enable sync functions */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    return;
  }

  /** Asynchronously compress data */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    return this.compressSync(input);
  }

  /** Asynchronously decompress data */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    await this.preload();
    return this.decompressSync(input, size);
  }

  /** Synchronously compress data */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    throw new Error(`${this.name}: sync compression not supported`);
  }

  /** Synchronously compress data */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    throw new Error(`${this.name}: sync decompression not supported`);
  }

  /** Compress batches */
  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    // TODO - implement incremental compression
    const input = await this.concatenate(asyncIterator);
    yield this.compress(input);
  }

  /** Decompress batches */
  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    // TODO - implement incremental compression
    const input = await this.concatenate(asyncIterator);
    yield this.decompress(input);
  }

  // HELPERS

  protected concatenate(asyncIterator): Promise<ArrayBuffer> {
    return concatenateArrayBuffersAsync(asyncIterator);
  }

  protected improveError(error) {
    if (!error.message.includes(this.name)) {
      error.message = `${this.name} ${error.message}`;
    }
    return error;
  }
}
