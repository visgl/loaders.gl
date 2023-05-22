// loaders.gl, MIT license
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {getPakoError} from './utils/pako-utils';
import pako from 'pako'; // https://bundlephobia.com/package/pako

export type DeflateCompressionOptions = CompressionOptions & {
  deflate?: pako.InflateOptions & pako.DeflateOptions & {useZlib?: boolean};
};

export type GZipCompressionOptions = CompressionOptions & {
  gzip?: pako.InflateOptions & pako.DeflateOptions;
};

/**
 * GZIP compression / decompression
 * Using PAKO library.
 */
export class GZipCompression extends Compression {
  readonly name: string = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;

  readonly options: DeflateCompressionOptions;

  private _chunks: ArrayBuffer[] = [];

  constructor(options: DeflateCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    return this.compressSync(input);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    return this.decompressSync(input);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const pakoOptions = this._getDeflateOptions();
    const inputArray = new Uint8Array(input);
    return pako.gzip(inputArray, pakoOptions).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const pakoOptions: pako.InflateOptions = this.options?.deflate || {};
    const inputArray = new Uint8Array(input);
    return pako.ungzip(inputArray, pakoOptions).buffer;
  }

  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions = this._getDeflateOptions();
    const pakoProcessor = new pako.Deflate(pakoOptions);
    yield* this.transformBatches(pakoProcessor, asyncIterator);
  }

  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions: pako.InflateOptions = this.options?.deflate || {};
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
        throw new Error(`${getPakoError()}write`);
      }
      const chunks = this._getChunks();
      yield* chunks;
    }

    // End
    const emptyChunk = new Uint8Array(0);
    const ok = pakoProcessor.push(emptyChunk, true); // true -> last chunk
    if (!ok) {
      // For some reason we get error but it still works???
      // throw new Error(getPakoError() + 'end');
    }
    const chunks = this._getChunks();
    yield* chunks;
  }

  protected _onData(chunk) {
    this._chunks.push(chunk);
  }

  protected _onEnd(status) {
    if (status !== 0) {
      throw new Error(getPakoError(status) + this._chunks.length);
    }
  }

  protected _getChunks(): ArrayBuffer[] {
    const chunks = this._chunks;
    this._chunks = [];
    return chunks;
  }

  protected _getDeflateOptions(): pako.DeflateOptions {
    const pakoOptions: pako.DeflateOptions = this.options?.deflate || {};
    if (this.options.quality) {
      // @ts-expect-error
      pakoOptions.level = this.options.quality || 5;
    }
    return pakoOptions;
  }
}
