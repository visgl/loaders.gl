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

  /**
   * Decompresses an ArrayBuffer containing an Lz4 frame. maxSize is optional; if not
   * provided, a maximum size will be determined by examining the data. The
   * returned ArrayBuffer will always be perfectly sized.
   */
  decompressSync(input: ArrayBuffer, maxSize?: number): ArrayBuffer {
    // let result = Buffer.alloc(maxSize);
    // const uncompressedSize = lz4js.decodeBlock(value, result);
    // // remove unnecessary bytes
    // result = result.slice(0, uncompressedSize);
    // return result;
    const inputArray = new Uint8Array(input);
    try {
      return lz4js.decompress(inputArray, maxSize).buffer;
    } catch (error) {
      throw this.improveError(error);
    }
  }
}
