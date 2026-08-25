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

/** Shared metadata and module-loading behavior for compression transforms. */
abstract class CompressionTransform {
  abstract readonly name: string;
  abstract readonly extensions: string[];
  abstract readonly contentEncodings: string[];
  abstract readonly isSupported: boolean;

  /** Preloads any dynamic libraries. May enable sync functions */
  async preload(modules: Record<string, any> = {}): Promise<Compressor | Decompressor | void> {
    registerJSModules(modules);
    return undefined;
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

/** Base class for compression-only implementations. */
export abstract class Compressor extends CompressionTransform {
  constructor(options?: CompressionOptions) {
    super();
    this.compressBatches = this.compressBatches.bind(this);
  }

  /** Asynchronously compresses data. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    return this.compressSync(input);
  }

  /** Synchronously compresses data. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    throw new Error(`${this.name}: sync compression not supported`);
  }

  /** Compresses batches. */
  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    // TODO - implement incremental compression
    const input = await this.concatenate(asyncIterator);
    yield this.compress(input);
  }
}

/** Base class for decompression-only implementations. */
export abstract class Decompressor extends CompressionTransform {
  constructor(options?: CompressionOptions) {
    super();
    this.decompressBatches = this.decompressBatches.bind(this);
  }

  /** Asynchronously decompresses data. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    await this.preload();
    return this.decompressSync(input, size);
  }

  /** Synchronously decompresses data. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    throw new Error(`${this.name}: sync decompression not supported`);
  }

  /** Decompresses batches. */
  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    // TODO - implement incremental compression
    const input = await this.concatenate(asyncIterator);
    yield this.decompress(input);
  }
}

/**
 * Combined compression and decompression compatibility base class.
 *
 * @deprecated Import a direction-specific `Compressor` or `Decompressor` implementation so
 * applications only bundle the codec direction they use.
 */
export abstract class Compression extends Compressor implements Decompressor {
  constructor(options?: CompressionOptions) {
    super(options);
    this.decompressBatches = this.decompressBatches.bind(this);
  }

  /** Asynchronously decompresses data. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    await this.preload();
    return this.decompressSync(input, size);
  }

  /** Synchronously decompresses data. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    throw new Error(`${this.name}: sync decompression not supported`);
  }

  /** Decompresses batches. */
  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const input = await this.concatenate(asyncIterator);
    yield this.decompress(input);
  }
}
