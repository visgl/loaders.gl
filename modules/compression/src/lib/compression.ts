// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Compression interface
import {
  concatenateArrayBuffersAsync,
  getJSModuleOrNull,
  registerJSModules
} from '@loaders.gl/loader-utils';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream,
  type NativeDecompressionFormat
} from './decompression-stream';

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

  /** Native format used for default asynchronous decompression, when available. */
  protected readonly decompressionStreamFormat: NativeDecompressionFormat | undefined = undefined;

  /** Whether default asynchronous decompression can use the native stream path. */
  protected readonly useNativeDecompressionStream: boolean = true;

  /** Registered fallback module that takes precedence over native decompression. */
  protected readonly decompressionModuleName: string | undefined = undefined;

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
    const nativeOutput = await this.tryDecompressWithNativeDecompressionStream(input);
    if (nativeOutput) {
      return nativeOutput;
    }
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
    if (this.decompressionStreamFormat && this.shouldUseNativeDecompressionStream()) {
      const outputBatches = decompressBatchesWithNativeDecompressionStream(
        asyncIterator,
        this.decompressionStreamFormat
      );
      if (outputBatches) {
        yield* outputBatches;
        return;
      }
    }

    // TODO - implement incremental compression
    const input = await this.concatenate(asyncIterator);
    yield this.decompress(input);
  }

  // HELPERS

  protected concatenate(asyncIterator): Promise<ArrayBuffer> {
    return concatenateArrayBuffersAsync(asyncIterator);
  }

  /**
   * Attempts native asynchronous decompression for classes that declare a stream format.
   *
   * @param input Compressed input data.
   * @returns Decompressed data, or null when native decompression should not be used.
   */
  protected async tryDecompressWithNativeDecompressionStream(
    input: ArrayBuffer
  ): Promise<ArrayBuffer | null> {
    if (!this.decompressionStreamFormat || !this.shouldUseNativeDecompressionStream()) {
      return null;
    }
    return await decompressWithNativeDecompressionStream(input, this.decompressionStreamFormat);
  }

  /**
   * Returns whether native asynchronous decompression should be attempted.
   *
   * Explicitly registered fallback modules take precedence so applications that provide a
   * library do not silently switch implementations when a runtime adds native support.
   */
  protected shouldUseNativeDecompressionStream(): boolean {
    return (
      this.useNativeDecompressionStream &&
      (!this.decompressionModuleName || !getJSModuleOrNull(this.decompressionModuleName))
    );
  }

  protected improveError(error) {
    if (!error.message.includes(this.name)) {
      error.message = `${this.name} ${error.message}`;
    }
    return error;
  }
}
