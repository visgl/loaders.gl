// loaders.gl, MIT license
import {isBrowser} from '@loaders.gl/loader-utils';
import {DeflateCompressionZlib, DeflateCompressionZlibOptions} from './deflate-compression-zlib';
import {Compression} from './compression';
import type {DeflateOptions} from 'fflate';
import {deflateSync, inflateSync} from 'fflate';

export type DeflateCompressionOptions = DeflateCompressionZlibOptions & {
  deflate?: DeflateOptions;
};

/**
 * DEFLATE compression / decompression
 * Implementation using fflate
 * @see https://bundlephobia.com/package/fflate
 */
export class DeflateCompression extends Compression {
  readonly name: string = 'fflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['fflate', 'gzip, zlib'];
  readonly isSupported: boolean = true;

  readonly options: DeflateCompressionOptions;

  constructor(options: DeflateCompressionOptions = {}) {
    super(options);
    this.options = options;
    if (!isBrowser && this.options.useZlib) {
      // @ts-ignore public API is equivalent
      return new DeflateCompressionZlib(options);
    }
  }

  // Async fflate uses Workers which interferes with loaders.gl

  // async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   // const options = this.options?.gzip || {};
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(deflate)(inputArray); // options - overload pick
  //   return outputArray.buffer;
  // }

  // async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
  //   const inputArray = new Uint8Array(input);
  //   const outputArray = await promisify1(inflate)(inputArray);
  //   return outputArray.buffer;
  // }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const options = this.options?.deflate || {};
    const inputArray = new Uint8Array(input);
    return deflateSync(inputArray, options).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const inputArray = new Uint8Array(input);
    return inflateSync(inputArray).buffer;
  }

  /*
  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions: pako.DeflateOptions = this.options?.fflate || {};
    const pakoProcessor = new pako.Deflate(pakoOptions);
    yield* this.transformBatches(pakoProcessor, asyncIterator);
  }

  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions: pako.InflateOptions = this.options?.fflate || {};
    const pakoProcessor = new pako.Inflate(pakoOptions);
    yield* this.transformBatches(pakoProcessor, asyncIterator);
  }

  async *transformBatches(
    pakoProcessor: pako.Inflate | pako.Deflate,
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    pakoProcessor.onData = this._onData.bind(this);
    pakoProcessor.onEnd = this._onEnd.bind(this);
    for await (const chunk of asyncIterator) {
      const uint8Array = new Uint8Array(chunk);
      const ok = pakoProcessor.push(uint8Array, false); // false -> not last chunk
      if (!ok) {
        throw new Error(`${this._getError()}write`);
      }
      const chunks = this._getChunks();
      yield* chunks;
    }

    // End
    const emptyChunk = new Uint8Array(0);
    const ok = pakoProcessor.push(emptyChunk, true); // true -> last chunk
    if (!ok) {
      // For some reason we get error but it still works???
      // throw new Error(this._getError() + 'end');
    }
    const chunks = this._getChunks();
    yield* chunks;
  }

  _onData(chunk) {
    this._chunks.push(chunk);
  }

  _onEnd(status) {
    if (status !== 0) {
      throw new Error(this._getError(status) + this._chunks.length);
    }
  }

  _getChunks(): ArrayBuffer[] {
    const chunks = this._chunks;
    this._chunks = [];
    return chunks;
  }
  */
}
