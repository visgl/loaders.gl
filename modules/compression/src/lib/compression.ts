// Compression interface
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

/** Compression options */
export type CompressionOptions = {
  /**
   * Compression quality (higher values better compression but exponentially slower)
   * brotli goes from 1-11
   * zlib goes from 1-9
   * 5 or 6 is usually a good compromise
   */
  quality?: number;

  /**
   * Whether to use built-in Zlib on node.js for max performance (doesn't handle incremental compression)
   * Currently only deflate, gzip and brotli are supported.
   */
  useZlib?: boolean;

  /**
   * Injection of npm modules - keeps large compression libraries out of standard bundle
   */
  modules?: CompressionModules;
};

/**
 * Injection of npm modules - keeps large compression libraries out of standard bundle
 */
export type CompressionModules = {
  brotli?: any;
  lz4js?: any;
  lzo?: any;
  'zstd-codec'?: any;
};

/** Compression */
export abstract class Compression {
  /** Default compression level for gzip, brotli etc */
  static DEFAULT_COMPRESSION_LEVEL = 5;

  /** Name of the compression */
  abstract readonly name: string;
  /** File extensions used for this */
  abstract readonly extensions: string[];
  /** Strings used for Content-Encoding headers in browser */
  abstract readonly contentEncodings: string[];
  /** Whether decompression is supported */
  abstract readonly isSupported: boolean;
  /** Whether compression is supported */
  get isCompressionSupported(): boolean {
    return this.isSupported;
  }

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
