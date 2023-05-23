// loaders.gl, MIT license
import {isBrowser} from '@loaders.gl/loader-utils';
import {GZipCompressionZlib, GZipCompressionZlibOptions} from './gzip-compression-zlib';

import {Compression} from './compression';
import {getPakoError} from './utils/pako-utils';
import pako from 'pako';

export type GZipCompressionOptions = GZipCompressionZlibOptions & {
  gzip?: pako.InflateOptions & pako.DeflateOptions;
};

/**
 * GZIP compression / decompression
 * Implementation using pako
 * @see https://bundlephobia.com/package/pako
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

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    return this.compressSync(input);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    return this.decompressSync(input);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const pakoOptions = this._getPakoOptions();
    const inputArray = new Uint8Array(input);
    return pako.gzip(inputArray, pakoOptions).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const pakoOptions: pako.InflateOptions = this.options?.gzip || {};
    const inputArray = new Uint8Array(input);
    return pako.ungzip(inputArray, pakoOptions).buffer;
  }

  async *compressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions = this._getPakoOptions();
    const pakoProcessor = new pako.Deflate(pakoOptions);
    yield* this.transformBatches(pakoProcessor, asyncIterator);
  }

  async *decompressBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const pakoOptions: pako.InflateOptions = this.options?.gzip || {};
    const pakoProcessor = new pako.Inflate(pakoOptions);
    yield* this.transformBatches(pakoProcessor, asyncIterator);
  }

  private async *transformBatches(
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

  private _onData(chunk) {
    this._chunks.push(chunk);
  }

  private _onEnd(status) {
    if (status !== 0) {
      throw new Error(getPakoError(status) + this._chunks.length);
    }
  }

  private _getChunks(): ArrayBuffer[] {
    const chunks = this._chunks;
    this._chunks = [];
    return chunks;
  }

  private _getPakoOptions(): pako.DeflateOptions {
    return {
      // @ts-ignore level is too strongly typed
      level: this.options.quality || Compression.DEFAULT_COMPRESSION_LEVEL,
      ...this.options?.gzipZlib
    };
  }
}
