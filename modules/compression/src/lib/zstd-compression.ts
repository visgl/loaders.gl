// ZSTD
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
// import {ZstdCodec} from 'zstd-codec'; // https://bundlephobia.com/package/zstd-codec

let ZstdCodec;
let zstd;

/**
 * Zstandard compression / decompression
 */
export class ZstdCompression extends Compression {
  readonly name: string = 'zstandard';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  /**
   * zstd-codec is an injectable dependency due to big size
   * @param options
   */
  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;

    const ZstdCodec = this.options?.modules?.['zstd-codec'];
    if (!ZstdCodec) {
      throw new Error(this.name);
    }
  }

  async preload(): Promise<void> {
    zstd = zstd || await new Promise((resolve) => ZstdCodec.run((zstd) => resolve(zstd)));
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const simpleZstd = new zstd.Simple();
    const inputArray = new Uint8Array(input);
    return simpleZstd.compress(inputArray).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const simpleZstd = new zstd.Simple();
    // var ddict = new zstd.Dict.Decompression(dictData);
    // var jsonBytes = simpleZstd.decompressUsingDict(jsonZstData, ddict);
    const inputArray = new Uint8Array(input);
    return simpleZstd.decompress(inputArray).buffer;
  }
}
