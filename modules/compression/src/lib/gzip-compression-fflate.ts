// loaders.gl, MIT license
import {isBrowser} from '@loaders.gl/loader-utils';
import {GZipCompressionZlib, GZipCompressionZlibOptions} from './gzip-compression-zlib';
import {Compression} from './compression';
import type {GzipOptions, AsyncGzipOptions} from 'fflate';
import {gzipSync, gunzipSync, Gzip, Gunzip} from 'fflate'; // https://bundlephobia.com/package/pako

export type GZipCompressionOptions = GZipCompressionZlibOptions & {
  gzip?: GzipOptions | AsyncGzipOptions;
};

/**
 * GZIP compression / decompression
 * Implementation using fflate
 * @see https://bundlephobia.com/package/fflate
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
    if (!isBrowser && this.options.useZlib) {
      // @ts-ignore public API is equivalent
      return new GZipCompressionZlib(options);
    }
  }

  // Async fflate uses Workers which interferes with loaders.gl
  // async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   // const options = this.options?.gzip || {};
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(gzip)(inputArray); // options - overload pick
  //   return outputArray.buffer;
  // }

  // Async fflate uses Workers which interferes with loaders.gl
  // async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   // const options = this.options?.gzip || {};
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(gunzip)(inputArray); // options - overload pick
  //   return outputArray.buffer;
  // }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this._getFflateOptions();
    const inputArray = new Uint8Array(input);
    return gzipSync(inputArray, options).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const inputArray = new Uint8Array(input);
    return gunzipSync(inputArray).buffer;
  }

  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const options = this._getFflateOptions();
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

  private async *transformBatches(
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

  private _onData(data: Uint8Array, final: boolean): void {
    this._chunks.push(data);
  }

  private _getChunks(): ArrayBuffer[] {
    const chunks = this._chunks;
    this._chunks = [];
    return chunks;
  }

  private _getFflateOptions(): GzipOptions {
    return {
      // @ts-ignore-error
      level: this.options.quality || Compression.DEFAULT_COMPRESSION_LEVEL,
      ...this.options?.gzip
    };
  }
}
