// loaders.gl, MIT license
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';
import {promisify2} from '@loaders.gl/loader-utils';
import * as zlib from 'zlib';
import type {ZlibOptions} from 'zlib';

export type DeflateCompressionOptions = CompressionOptions & {
  deflate?: ZlibOptions;
};

/**
 * GZIP compression / decompression
 * Using Node.js zlib library (works under Node only)
 */
export class GZipCompression extends Compression {
  readonly name: string = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = isBrowser;

  readonly options: DeflateCompressionOptions;

  constructor(options: DeflateCompressionOptions = {}) {
    super(options);
    this.options = options;
    if (isBrowser) {
      throw new Error('zlib only available under Node.js');
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const options: ZlibOptions = this.options?.deflate || {
      level: this.options.quality || 6
    };
    const buffer = await promisify2(zlib.gzip)(input, options);
    return toArrayBuffer(buffer);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const buffer = await promisify2(zlib.gunzip)(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options: ZlibOptions = this.options?.deflate || {
      level: this.options.quality || 6
    };
    const buffer = zlib.gzipSync(input, options);
    return toArrayBuffer(buffer);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const buffer = zlib.gunzipSync(input, this.options.deflate || {});
    return toArrayBuffer(buffer);
  }
}
