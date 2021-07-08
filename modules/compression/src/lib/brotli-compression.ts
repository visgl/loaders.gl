// BROTLI
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import type brotliNamespace from 'brotli';
// import brotli from 'brotli';  // https://bundlephobia.com/package/brotli
import zlib from 'zlib';
import {promisify} from 'util';

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
  readonly isSupported = true;
  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions) {
    super(options);
    this.options = options;
  }

  /**
   * brotli is an injectable dependency due to big size
   * @param options
   */
  async preload(): Promise<void> {
    brotli = brotli || this.options?.modules?.brotli;
    if (!brotli) {
      throw new Error(this.name);
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = await promisify(zlib.brotliCompress)(input);
      return toArrayBuffer(buffer);
    }
    return this.compressSync(input);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = zlib.brotliCompressSync(input);
      return toArrayBuffer(buffer);
    }
    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);
    // @ts-ignore brotli types state that only Buffers are accepted...
    return brotli.compress(inputArray, brotliOptions);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = await promisify(zlib.brotliDecompress)(input);
      return toArrayBuffer(buffer);
    }
    return this.decompressSync(input);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    // On Node.js we can use built-in zlib
    if (!isBrowser && this.options.brotli?.useZlib) {
      const buffer = zlib.brotliDecompressSync(input);
      return toArrayBuffer(buffer);
    }
    const brotliOptions = {...DEFAULT_BROTLI_OPTIONS.brotli, ...this.options?.brotli};
    const inputArray = new Uint8Array(input);
    // @ts-ignore brotli types state that only Buffers are accepted...
    return brotli.decompress(inputArray, brotliOptions);
  }
}
