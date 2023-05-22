// BROTLI
import {isBrowser} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {BrotliCompressionZlib} from './brotli-compression-zlib';
import type brotliNamespace from 'brotli';
// import brotli from 'brotli';  // https://bundlephobia.com/package/brotli
// import {BrotliDecode} from '../brotli/decode';

export type BrotliCompressionOptions = CompressionOptions & {
  brotli?: {
    mode?: number;
    quality?: number;
    lgwin?: number;
    useZlib?: boolean;
  };
};

const DEFAULT_BROTLI_OPTIONS = {
  brotli: {
    mode: 0,
    quality: 8,
    lgwin: 22
  }
};

let brotli: typeof brotliNamespace;

/**
 * brotli compression / decompression
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

    if (!isBrowser && this.options.brotli?.useZlib) {
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

    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);

    const outputArray = brotli.compress(inputArray, {quality: 5, brotliOptions});
    return outputArray.buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    if (!brotli) {
      throw new Error('brotli compression: brotli module not installed');
    }

    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);

    // @ts-ignore brotli types state that only Buffers are accepted...
    const outputArray = brotli.decompress(inputArray, brotliOptions);
    return outputArray.buffer;
    // const outputArray = BrotliDecode(inputArray, undefined);
    // return outputArray.buffer;
  }
}
