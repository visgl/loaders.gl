// loaders.gl, MIT license
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import {promisify2} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import * as zlib from 'zlib';
import type {ZlibOptions} from 'zlib';

export type DeflateCompressionOptions = CompressionOptions & {
  deflate?: ZlibOptions;
};

/**
 * DEFLATE compression / decompression
 * Using Node.js zlib library (works under Node only)
 */
export class DeflateCompression extends Compression {
  readonly name: string = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = isBrowser;

  readonly options: DeflateCompressionOptions;

  constructor(options: DeflateCompressionOptions = {}) {
    super(options);
    this.options = options;
    if (!isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const buffer = await promisify2(zlib.deflate)(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const buffer = await promisify2(zlib.inflate)(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const buffer = zlib.deflateSync(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const buffer = zlib.inflateSync(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }
}
