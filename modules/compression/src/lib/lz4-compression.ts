// LZ4
import {toArrayBuffer} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';

let LZ4;

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

    LZ4 = LZ4 || this.options?.modules?.LZ4;
    if (!LZ4) {
      throw new Error(this.name);
    }
  }

  compressSync(data: ArrayBuffer): ArrayBuffer {
    try {
      const input = Buffer.from(data);
      let output = Buffer.alloc(LZ4.encodeBound(input.length));
      const compressedSize = LZ4.encodeBlock(input, output);
      output = output.slice(0, compressedSize);

      return toArrayBuffer(output);
    } catch (error) {
      throw this.improveError(error);
    }
  }

  /**
   * Decompresses an ArrayBuffer containing an Lz4 frame. maxSize is optional; if not
   * provided, a maximum size will be determined by examining the data. The
   * returned ArrayBuffer will always be perfectly sized.
   */
  decompressSync(data: ArrayBuffer, maxSize?: number): ArrayBuffer {
    if (!maxSize) {
      const error = new Error('Need to provide maxSize');
      throw this.improveError(error);
    }

    try {
      const input = Buffer.from(data);

      let uncompressed = Buffer.alloc(maxSize);
      const uncompressedSize = LZ4.decodeBlock(input, uncompressed);
      uncompressed = uncompressed.slice(0, uncompressedSize);

      return toArrayBuffer(uncompressed);
    } catch (error) {
      throw this.improveError(error);
    }
  }
}
