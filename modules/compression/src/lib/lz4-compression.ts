// LZ4
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
// import lz4js from 'lz4js'; // https://bundlephobia.com/package/lz4

let lz4js;

/**
 * LZ4 compression / decompression
 */
export class LZ4Compression extends Compression {
  readonly name: string = 'lz4';
  readonly extensions = ['lz4'];
  readonly contentEncodings = ['x-lz4'];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;

    lz4js = lz4js || this.options?.modules?.lz4js;
    if (!lz4js) {
      throw new Error(this.name);
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const inputArray = new Uint8Array(input);
    return lz4js.compress(inputArray).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const inputArray = new Uint8Array(input);
    return lz4js.decompress(inputArray).buffer;
  }
}
