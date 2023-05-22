// loaders.gl, MIT license
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import type {GzipOptions, AsyncGzipOptions} from 'fflate';
import {gzipSync, gunzipSync, Gzip, Gunzip} from 'fflate'; // https://bundlephobia.com/package/pako

export type GZipCompressionOptions = CompressionOptions & {
  gzip?: GzipOptions | AsyncGzipOptions;
};

/**
 * GZIP compression / decompression
 */
export class GZipCompression extends Compression {
  readonly name: string = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;  

  readonly options: GZipCompressionOptions;
  private _chunks: ArrayBuffer[] = [];

  constructor(options: GZipCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  // Async fflate uses Workers which interferes with loaders.gl
  
  // async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   // const options = this.options?.gzip || {};
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(gzip)(inputArray); // options - overload pick
  //   return outputArray.buffer;
  // }

  // async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   // const options = this.options?.gzip || {};
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(gunzip)(inputArray); // options - overload pick
  //   return outputArray.buffer;
  // }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    // @ts-expect-error level
    const options: GzipOptions = this.options?.gzip || {
      level: this.options.quality || 6
    };
    const inputArray = new Uint8Array(input);
    return gzipSync(inputArray, options).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    // const options = this.options?.gzip || {};
    const inputArray = new Uint8Array(input);
    return gunzipSync(inputArray).buffer;
  }

  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    // @ts-expect-error level
    const options: GzipOptions = this.options?.gzip || {
      level: this.options.quality || 6
    };
    const streamProcessor = new Gzip(options);
    streamProcessor.ondata = this._onData.bind(this);
    yield* this.transformBatches(streamProcessor, asyncIterator);
  }

  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const streamProcessor = new Gunzip();
    streamProcessor.ondata = this._onData.bind(this);
    yield* this.transformBatches(streamProcessor, asyncIterator);
  }

  protected async *transformBatches(
    streamProcessor: Gzip | Gunzip,
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    for await (const chunk of asyncIterator) {
      const uint8Array = new Uint8Array(chunk);
      streamProcessor.push(uint8Array, false); // false -> not last chunk
      const chunks = this._getChunks();
      yield* chunks;
    }

    // End
    const emptyChunk = new Uint8Array(0);
    streamProcessor.push(emptyChunk, true); // true -> last chunk
    const chunks = this._getChunks();
    yield* chunks;
  }

  _onData(data: Uint8Array, final: boolean): void {
    this._chunks.push(data);
  }

  _getChunks(): ArrayBuffer[] {
    const chunks = this._chunks;
    this._chunks = [];
    return chunks;
  }
}
