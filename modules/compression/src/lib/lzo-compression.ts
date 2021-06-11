// LZO
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
// import {isBrowser} from '@loaders.gl/loader-utils';
import {toBuffer} from '@loaders.gl/loader-utils';
import {decompress} from 'lzo-wasm';
// import lzo from 'lzo'; // https://bundlephobia.com/package/lzo

let lzo;

/**
 * Lempel-Ziv-Oberheimer compression / decompression
 */
export class LZOCompression extends Compression {
  readonly name = 'lzo';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = false; // !isBrowser;
  readonly options: CompressionOptions;

  /**
   * lzo is an injectable dependency due to big size
   * @param options
   */
  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;

    lzo = lzo || this.options?.modules?.lzo;
    if (!lzo) {
      throw new Error(this.name);
    }
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    // const inputArray = new Uint8Array(input);
    const inputBuffer = toBuffer(input);
    return lzo.compress(inputBuffer).buffer;
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      await this.preload();
      // const inputArray = new Uint8Array(input);
      const inputBuffer = toBuffer(input);
      return lzo.decompress(inputBuffer).buffer;
    } catch {
      return decompress(input);
    }
  }
}
