// loaders.gl, MIT license
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import {promisify2} from '@loaders.gl/loader-utils';
import type {ZlibOptions} from 'zlib';
import * as zlib from 'zlib';

const DEFAULT_COMPRESSION_LEVEL = 6;

export type GZipCompressionZlibOptions = CompressionOptions & {
  gzipZlib?: ZlibOptions;
};

/**
 * GZIP compression / decompression
 * Using Node.js zlib library (works under Node only)
 */
export class GZipCompressionZlib extends Compression {
  readonly name: string = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = isBrowser;

  readonly options: GZipCompressionZlibOptions;

  constructor(options: GZipCompressionZlibOptions = {}) {
    super(options);
    this.options = options;
    if (isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options = this._getZlibOptions();
    const buffer = await promisify2(zlib.gzip)(input, options);
    return toArrayBuffer(buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options = this._getZlibOptions();
    const buffer = await promisify2(zlib.gunzip)(input, options);
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getZlibOptions();
    const buffer = zlib.gzipSync(input, options);
    return toArrayBuffer(buffer);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getZlibOptions();
    const buffer = zlib.gunzipSync(input, options);
    return toArrayBuffer(buffer);
  }

  protected _getZlibOptions(): ZlibOptions {
    return {
      level: this.options.quality || DEFAULT_COMPRESSION_LEVEL,
      ...this.options?.gzipZlib
    };
  }
}
