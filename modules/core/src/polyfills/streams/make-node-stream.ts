// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Readable, getDefaultHighWaterMark} from 'node:stream';
import type {ReadableOptions} from 'node:stream';

export type MakeStreamOptions = ReadableOptions;

/** Builds a Node stream of byte chunks from a synchronous or asynchronous iterable. */
export function makeNodeStream<Value>(
  source: Iterable<Value> | AsyncIterable<Value>,
  options?: ReadableOptions
): Readable {
  const iterator =
    Symbol.asyncIterator in source ? source[Symbol.asyncIterator]() : source[Symbol.iterator]();
  let iteratorFailed = false;
  const convertedIterator: AsyncIterableIterator<Uint8Array> = {
    async next() {
      let result: IteratorResult<Value>;
      try {
        result = await iterator.next();
      } catch (error) {
        iteratorFailed = true;
        throw error;
      }
      if (result.done) {
        await iterator.return?.();
        return {done: true, value: undefined};
      }
      return {done: false, value: new Uint8Array(result.value as ArrayBuffer)};
    },
    async return(value?: unknown) {
      await iterator.return?.(value as never);
      return {done: true, value: undefined};
    },
    async throw(error?: unknown) {
      if (iterator.throw) {
        await iterator.throw(error);
      }
      return {done: true, value: undefined};
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };

  const objectMode = options?.objectMode ?? false;
  const stream = Readable.from(convertedIterator, {
    highWaterMark: getDefaultHighWaterMark(objectMode),
    ...options,
    objectMode
  });
  const destroyStream = stream._destroy;
  stream._destroy = function (error, callback) {
    destroyStream.call(this, error, destroyError => {
      // The previous adapter consumed explicit destroy errors after forwarding them to the iterator.
      callback(!iteratorFailed && destroyError === error ? null : destroyError);
    });
  };
  return stream;
}
