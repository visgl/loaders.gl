// LZ4
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils/';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
// import lz4js from 'lz4js'; // https://bundlephobia.com/package/lz4

let lz4js;
// Numbers are taken from here:
// https://github.com/Benzinga/lz4js
const FILE_DESCRIPTOR_VERSION = 0x40;
const DEFAULT_BLOCK_SIZE = 7;
const BLOCK_SIZE_SHIFT = 4;
const LZ4_MAGIC_NUMBER = 0x184d2204;

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
    const shouldAddHeader = this.checkMagicNumber(input);

    if (shouldAddHeader) {
      input = this.addHeaderForLZ4file(input);
    }

    const inputArray = new Uint8Array(input);
    try {
      return lz4js.decompress(inputArray, maxSize).buffer;
    } catch (error) {
      throw this.improveError(error);
    }
  }

  /**
   * Add dummy header to file if it is missed.
   * @param input
   */
  addHeaderForLZ4file(input: ArrayBuffer): ArrayBuffer {
    const magic = new Uint32Array([LZ4_MAGIC_NUMBER]);
    // TODO need to implement descriptor as part of header
    // https://github.com/Benzinga/lz4js/blob/master/lz4.js#L486
    const frameDescriptor = Buffer.from([
      FILE_DESCRIPTOR_VERSION,
      DEFAULT_BLOCK_SIZE << BLOCK_SIZE_SHIFT
      // Here should be hash part
    ]);

    return concatenateArrayBuffers(magic.buffer, frameDescriptor, input);
  }

  /**
   * Compare file magic with lz4 magic number
   * @param input
   * @returns
   */
  checkMagicNumber(input: ArrayBuffer): boolean {
    const magic = new Uint32Array(input.slice(0, 4));
    return magic[0] !== LZ4_MAGIC_NUMBER;
  }
}
