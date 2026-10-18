// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/**
 * Forked from @gozala's web-blob under MIT license
 * @see https://github.com/Gozala/web-blob
 */
import {ReadableStreamPolyfill} from './readable-stream';
import {BlobStreamController} from './blob-stream-controller';

/**
 * Blob stream is a `ReadableStream` extension optimized to have minimal
 * overhead when consumed as `AsyncIterable<Uint8Array>`.
 * extends {ReadableStream<Uint8Array>}
 * implements {AsyncIterable<Uint8Array>}
 */
// @ts-ignore
export class BlobStream<T> extends ReadableStreamPolyfill<T> {
  private readonly _chunks: Uint8Array[];
  /**
   * @param chunks
   */
  constructor(chunks) {
    // @ts-ignore
    super(new BlobStreamController(chunks.values()), {type: 'bytes'});
    /** @private */
    this._chunks = chunks;
  }

  /**
   * @property [_options.preventCancel]
   */
  // @ts-ignore
  async *[Symbol.asyncIterator](_options?: {preventCancel?: boolean}): AsyncIterable<Uint8Array> {
    const reader = this.getReader();
    yield* this._chunks;
    reader.releaseLock();
  }
}
