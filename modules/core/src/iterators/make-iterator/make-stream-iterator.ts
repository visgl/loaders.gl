// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Readable} from 'stream';
import {isBrowser, toArrayBuffer} from '@loaders.gl/loader-utils';

export type StreamIteratorOptions = {
  _streamReadAhead?: boolean;
};

/**
 * Returns an async iterable that reads from a stream (works in both Node.js and browsers)
 * @param stream stream to iterator over
 */
export function makeStreamIterator(
  stream: ReadableStream | Readable,
  options?: StreamIteratorOptions
): AsyncIterable<ArrayBuffer> {
  return isBrowser
    ? makeBrowserStreamIterator(stream as ReadableStream, options)
    : makeNodeStreamIterator(stream as Readable, options);
}

/**
 * Returns an async iterable that reads from a DOM (browser) stream
 * @param stream stream to iterate from
 * @see https://jakearchibald.com/2017/async-iterators-and-generators/#making-streams-iterate
 */
async function* makeBrowserStreamIterator(
  stream: ReadableStream,
  options?: StreamIteratorOptions
): AsyncIterable<ArrayBuffer> {
  // WhatWG: stream is supposed to have a `getIterator` method
  // if (typeof stream.getIterator === 'function') {
  //   return stream.getIterator();
  // }
  // if (typeof stream[Symbol.asyncIterator] === 'function') {
  //   return makeToArrayBufferIterator(stream);
  // }

  // In the browser, we first need to get a lock on the stream
  const reader = stream.getReader();

  let nextBatchPromise: Promise<{done?: boolean; value?: Uint8Array}> | undefined;
  let streamFinished = false;
  let streamReadFailed = false;
  let iteratorFailed = false;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentBatchPromise = nextBatchPromise || reader.read();
      nextBatchPromise = undefined;
      // Read from the stream
      // value is a Uint8Array
      let batch;
      try {
        batch = await currentBatchPromise;
      } catch (error) {
        streamReadFailed = true;
        throw error;
      }
      const {done, value} = batch;
      // Exit if we're done
      if (done) {
        streamFinished = true;
        return;
      }
      // Issue a read for an additional batch while the current batch is processed
      if (options?._streamReadAhead) {
        nextBatchPromise = reader.read();
        // Observe a prefetched rejection even if the consumer stops before requesting it
        void nextBatchPromise.catch(() => {});
      }
      // Else yield the chunk
      yield toArrayBuffer(value);
    }
  } catch (error) {
    iteratorFailed = true;
    throw error;
  } finally {
    let cleanupFailed = false;
    let cleanupError: unknown;

    if (!streamFinished && !streamReadFailed) {
      try {
        await reader.cancel();
      } catch (error) {
        cleanupFailed = true;
        cleanupError = error;
      }
    }

    try {
      reader.releaseLock();
    } catch (error) {
      if (!cleanupFailed) {
        cleanupFailed = true;
        cleanupError = error;
      }
    }

    // Preserve errors from iteration instead of replacing them with cleanup errors
    if (!iteratorFailed && cleanupFailed) {
      throw cleanupError;
    }
  }
}

/**
 * Returns an async iterable that reads from a DOM (browser) stream
 * @param stream stream to iterate from
 * @note Requires Node.js >= 10
 */
async function* makeNodeStreamIterator(
  stream: Readable,
  options?: StreamIteratorOptions
): AsyncIterable<ArrayBuffer> {
  // Hacky test for node version to ensure we don't call bad polyfills
  // NODE 10+: stream is an asyncIterator
  for await (const chunk of stream) {
    yield toArrayBuffer(chunk); // Coerce each chunk to ArrayBuffer
  }
}
/* TODO - remove NODE < 10
 * @see https://github.com/bustle/streaming-iterables, MIT license
 *
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return;
  }

  // TODO - check if is this ever used in Node 10+?
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = stream.read();
    if (data !== null) {
      yield toArrayBuffer(data);
      // eslint-disable-next-line no-continue
      continue;
    }
    if (stream._readableState?.ended) {
      return;
    }
    await onceReadable(stream);
  }

async function onceReadable(stream: Readable): Promise<any> {
  return new Promise((resolve) => {
    stream.once('readable', resolve);
  });
}
  */
