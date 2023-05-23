// BROTLI
import {isBrowser} from '@loaders.gl/loader-utils';
import {Compression} from './compression';
import {BrotliCompressionZlib, BrotliCompressionZlibOptions} from './brotli-compression-zlib';
import type brotliNamespace from 'brotli';
import type {BrotliOptions} from 'brotli';
// import brotli from 'brotli';
// import {BrotliDecode} from '../brotli/decode';

export type BrotliCompressionOptions = BrotliCompressionZlibOptions & {
  brotli?: {};
};

let brotli: typeof brotliNamespace;

/**
 * brotli compression / decompression
 * Implemented with brotli package
 * @see https://bundlephobia.com/package/brotli
 */
export class BrotliCompression extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];

  get isSupported() {
    return brotli;
  }
  get isCompressionSupported() {
    return false;
  }

  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions = {}) {
    super(options);
    this.options = options;

    // dependency injection
    brotli = brotli || this.options?.modules?.brotli || Compression.modules.brotli;

    if (!isBrowser && this.options.useZlib) {
      // @ts-ignore public API is equivalent
      return new BrotliCompressionZlib(options);
    }
  }

  /**
   * brotli is an injectable dependency due to big size
   * @param options
   */
  async preload(): Promise<void> {
    brotli = brotli || (await this.options?.modules?.brotli);
    if (!brotli) {
      // eslint-disable-next-line no-console
      console.warn(`${this.name} library not installed`);
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!brotli) {
      throw new Error('brotli compression: brotli module not installed');
    }
    const options = this._getBrotliOptions();
    const inputArray = new Uint8Array(input);
    const outputArray = brotli.compress(inputArray, options);
    return outputArray.buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    if (!brotli) {
      throw new Error('brotli compression: brotli module not installed');
    }

    const options = this._getBrotliOptions();
    const inputArray = new Uint8Array(input);

    // @ts-ignore brotli types state that only Buffers are accepted...
    const outputArray = brotli.decompress(inputArray, options);
    return outputArray.buffer;
    // const outputArray = BrotliDecode(inputArray, undefined);
    // return outputArray.buffer;
  }

  private _getBrotliOptions(): BrotliOptions {
    return {
      level: this.options.quality || Compression.DEFAULT_COMPRESSION_LEVEL,
      ...this.options?.brotli
    };
  }
}
