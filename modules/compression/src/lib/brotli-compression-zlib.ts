// BROTLI
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import zlib, {BrotliOptions} from 'zlib';
import {promisify1, promisify2} from '@loaders.gl/loader-utils';

export type BrotliCompressionZlibOptions = CompressionOptions & {
  brotliZlib?: BrotliOptions;
};

/**
 * brotli compression / decompression
 * zlib implementation
 * @note Node uses compression level 11 by default which is 100x slower!!
 */
export class BrotliCompressionZlib extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;
  readonly options: BrotliCompressionZlibOptions;

  constructor(options: BrotliCompressionZlibOptions = {}) {
    super(options);
    this.options = options;
    if (isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options = this._getBrotliZlibOptions();
    // @ts-expect-error promisify type failure on overload
    const buffer = await promisify2(zlib.brotliCompress)(input, options);
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getBrotliZlibOptions();
    const buffer = zlib.brotliCompressSync(input, options);
    return toArrayBuffer(buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const buffer = await promisify1(zlib.brotliDecompress)(input);
    return toArrayBuffer(buffer);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const buffer = zlib.brotliDecompressSync(input);
    return toArrayBuffer(buffer);
  }

  private _getBrotliZlibOptions(): BrotliOptions {
    // {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 4}}
    return {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: Compression.DEFAULT_COMPRESSION_LEVEL,
        ...this.options?.brotliZlib
      }
    };
  }
}
