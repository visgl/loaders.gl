// loaders.gl, MIT license
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import {promisify2} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import * as zlib from 'zlib';
import type {ZlibOptions} from 'zlib';

export type DeflateCompressionZlibOptions = CompressionOptions & {
  deflateZlib?: ZlibOptions;
};

/**
 * DEFLATE compression / decompression
 * Using Node.js zlib library (works under Node only)
 */
export class DeflateCompressionZlib extends Compression {
  readonly name: string = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = isBrowser;

  readonly options: DeflateCompressionZlibOptions;

  constructor(options: DeflateCompressionZlibOptions = {}) {
    super(options);
    this.options = options;
    if (!isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options = this._getZlibOptions();
    const buffer = await promisify2(zlib.deflate)(input, options);
    return toArrayBuffer(buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options = this._getZlibOptions();
    const buffer = await promisify2(zlib.inflate)(input, options);
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getZlibOptions();
    const buffer = zlib.deflateSync(input, options);
    return toArrayBuffer(buffer);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getZlibOptions();
    const buffer = zlib.inflateSync(input, options);
    return toArrayBuffer(buffer);
  }

  protected _getZlibOptions(): ZlibOptions {
    return {
      level: this.options.quality || Compression.DEFAULT_COMPRESSION_LEVEL,
      ...this.options?.deflateZlib
    };
  }
}
