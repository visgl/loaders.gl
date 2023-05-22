// Compression interface
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

/** Compression options */
export type CompressionOptions = {
  /** Compression quality typically goes from 1-11 (higher values better but slower) */
  quality?: number;
  /** Injection of npm modules for large libraries */
  modules?: CompressionModules;
};

export type CompressionModules = {
  brotli?: any;
  lz4js?: any;
  lzo?: any;
  'zstd-codec'?: any;
}


/** Compression */
export abstract class Compression {
  /** Name of the compression */
  abstract readonly name: string;
  /** File extensions used for this */
  abstract readonly extensions: string[];
  /** Strings used for Content-Encoding headers in browser */
  abstract readonly contentEncodings: string[];
  /** Whether decompression is supported */
  abstract readonly isSupported: boolean;
  /** Whether compression is supported */
  get isCompressionSupported(): boolean { return this.isSupported; };

  static modules: CompressionModules = {};

  constructor(options) {
    this.compressBatches = this.compressBatches.bind(this);
    this.decompressBatches = this.decompressBatches.bind(this);
  }

  /** Preloads any dynamic libraries. May enable sync functions */
  async preload(): Promise<void> {
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
