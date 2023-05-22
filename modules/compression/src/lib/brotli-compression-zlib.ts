// BROTLI
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import zlib from 'zlib'; 
import {promisify1, promisify2} from '@loaders.gl/loader-utils';

export type BrotliCompressionOptions = CompressionOptions & {
  brotli?: {
    mode?: number;
    quality?: number;
    lgwin?: number;
    useZlib?: boolean;
  };
};

/**
 * brotli compression / decompression using zlib
 */
export class BrotliCompressionZlib extends Compression {
  readonly name: string = 'brotli';
  readonly extensions = ['br'];
  readonly contentEncodings = ['br'];
  readonly isSupported = true;
  readonly options: BrotliCompressionOptions;

  constructor(options: BrotliCompressionOptions = {}) {
    super(options);
    this.options = options;
    if (isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // @ts-expect-error overloads - Node uses compression level 11 by default which is 100x slower
    const buffer = await promisify2(zlib.brotliCompress)(input, {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 4}});
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const buffer = zlib.brotliCompressSync(input, {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 4}});
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
}
