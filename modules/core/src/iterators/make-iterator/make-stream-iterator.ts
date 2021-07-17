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

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentBatchPromise = nextBatchPromise || reader.read();
      // Issue a read for an additional batch, while we await the next batch
      // Idea is to make fetching happen in parallel with processing / parsing
      if (options?._streamReadAhead) {
        nextBatchPromise = reader.read();
      }
      // Read from the stream
      // value is a Uint8Array
      const {done, value} = await currentBatchPromise;
      // Exit if we're done
      if (done) {
        return;
      }
      // Else yield the chunk
      yield toArrayBuffer(value);
    }
  } catch (error) {
    // TODO - examples makes it look like this should always be called,
    // but that generates exceptions so only call it if we do not reach the end
    reader.releaseLock();
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
