// ZSTD
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
// import {ZstdCodec} from 'zstd-codec'; // https://bundlephobia.com/package/zstd-codec

const CHUNK_SIZE = 1000000; // Tested value

let ZstdCodec;
let zstd;

/**
 * Zstandard compression / decompression
 */
export class ZstdCompression extends Compression {
  readonly name: string = 'zstd';
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

    ZstdCodec = this.options?.modules?.['zstd-codec'];
    if (!ZstdCodec) {
      // eslint-disable-next-line no-console
      console.warn(`${this.name} library not installed`);
    }
  }

  async preload(): Promise<void> {
    if (!zstd && ZstdCodec) {
      zstd = await new Promise((resolve) => ZstdCodec.run((zstd) => resolve(zstd)));
    }
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

  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    await this.preload();
    const simpleZstd = new zstd.Streaming();
    const inputArray = new Uint8Array(input);

    const chunks: ArrayBuffer[] = [];
    for (let i = 0; i <= inputArray.length; i += CHUNK_SIZE) {
      chunks.push(input.slice(i, i + CHUNK_SIZE));
    }

    const decompressResult = await simpleZstd.decompressChunks(chunks);
    return decompressResult.buffer;
  }
}
