// SNAPPY (aka ZIPPY)
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {compress, uncompress} from 'snappyjs'; // https://bundlephobia.com/package/snappy

/**
 * Snappy/zippy compression / decompression
 */
export class SnappyCompression extends Compression {
  readonly name: string = 'snappy';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  constructor(options?: CompressionOptions) {
    super(options);
    this.options = options || {};
  }

  /*
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // Accepts arrayBuffer - https://github.com/zhipeng-jia/snappyjs#usage
    return await compress(input);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    // Accepts arrayBuffer - https://github.com/zhipeng-jia/snappyjs#usage
    return await uncompress(input);
  }
  */

  compressSync(input: ArrayBuffer): ArrayBuffer {
    // Accepts arrayBuffer - https://github.com/zhipeng-jia/snappyjs#usage
    return compress(input);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    // Accepts arrayBuffer - https://github.com/zhipeng-jia/snappyjs#usage
    return uncompress(input);
  }
}
