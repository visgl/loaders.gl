// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Readable} from 'stream';
import {isBrowser} from '@loaders.gl/loader-utils';

export type StreamIteratorOptions = {
  _streamReadAhead?: boolean;
  /** Cancels the active stream read and rejects iteration with the signal reason. */
  signal?: AbortSignal;
};

/**
 * Returns an async iterable that reads from a stream (works in both Node.js and browsers)
 * @param stream stream to iterator over
 */
export function makeStreamIterator<T>(
  stream: ReadableStream<T> | Readable,
  options?: StreamIteratorOptions
): AsyncIterable<T> {
  return isBrowser || isReadableStream(stream)
    ? makeBrowserStreamIterator(stream as ReadableStream<T>, options)
    : makeNodeStreamIterator(stream as Readable, options);
}

/** Detects WHATWG streams in Node.js as well as in browsers. */
function isReadableStream<T>(stream: ReadableStream<T> | Readable): stream is ReadableStream<T> {
  return typeof (stream as ReadableStream<T>).getReader === 'function';
}

/**
 * Returns an async iterable that reads from a DOM (browser) stream
 * @param stream stream to iterate from
 * @see https://jakearchibald.com/2017/async-iterators-and-generators/#making-streams-iterate
 */
async function* makeBrowserStreamIterator<T>(
  stream: ReadableStream<T>,
  options?: StreamIteratorOptions
): AsyncIterable<T> {
  // WhatWG: stream is supposed to have a `getIterator` method
  // if (typeof stream.getIterator === 'function') {
  //   return stream.getIterator();
  // }
  // if (typeof stream[Symbol.asyncIterator] === 'function') {
  //   return makeToArrayBufferIterator(stream);
  // }

  // In the browser, we first need to get a lock on the stream
  const reader = stream.getReader();
  const signal = options?.signal;
  const abortListener = () => {
    // Canceling the reader settles a pending read. The loop then throws the signal reason.
    void reader.cancel(signal?.reason).catch(() => {});
  };

  let nextBatchPromise: Promise<{done?: boolean; value?: T}> | undefined;
  let streamFinished = false;
  let streamReadFailed = false;
  let iteratorFailed = false;

  try {
    throwIfAborted(signal);
    signal?.addEventListener('abort', abortListener, {once: true});

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentBatchPromise = nextBatchPromise || reader.read();
      nextBatchPromise = undefined;
      // Read from the stream
      let batch;
      try {
        batch = await currentBatchPromise;
      } catch (error) {
        streamReadFailed = true;
        throw error;
      }
      throwIfAborted(signal);
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
      if (value) {
        yield value;
      }
    }
  } catch (error) {
    iteratorFailed = true;
    throw error;
  } finally {
    signal?.removeEventListener('abort', abortListener);
    let cleanupError: unknown;

    if (!streamFinished && !streamReadFailed) {
      try {
        await reader.cancel();
      } catch (error) {
        cleanupError = error;
      }
    }

    try {
      reader.releaseLock();
    } catch (error) {
      cleanupError ||= error;
    }

    // Preserve iteration errors instead of replacing them with cleanup errors
    if (!iteratorFailed && cleanupError) {
      throw cleanupError;
    }
  }
}

/**
 * Returns an async iterable that reads from a DOM (browser) stream
 * @param stream stream to iterate from
 * @note Requires Node.js >= 10
 */
async function* makeNodeStreamIterator<T>(
  stream: Readable,
  options?: StreamIteratorOptions
): AsyncIterable<T> {
  // Node streams and modern Node.js Web streams both expose an async iterator.
  const iterator = stream[Symbol.asyncIterator]();
  const signal = options?.signal;
  let abortListener: (() => void) | undefined;
  const abortPromise = signal
    ? new Promise<never>((_resolve, reject) => {
        abortListener = () => reject(getAbortReason(signal));
        signal.addEventListener('abort', abortListener, {once: true});
      })
    : null;
  let iteratorFailed = false;
  let streamFinished = false;

  try {
    throwIfAborted(signal);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const nextPromise = iterator.next();
      if (abortPromise) {
        // Observe a late failure if cancellation wins the race.
        void nextPromise.catch(() => {});
      }
      const result = abortPromise
        ? await Promise.race([nextPromise, abortPromise])
        : await nextPromise;
      throwIfAborted(signal);
      if (result.done) {
        streamFinished = true;
        return;
      }
      yield result.value;
    }
  } catch (error) {
    iteratorFailed = true;
    throw error;
  } finally {
    if (abortListener) {
      signal?.removeEventListener('abort', abortListener);
    }
    if (!streamFinished) {
      try {
        await iterator.return?.();
      } catch (error) {
        if (!iteratorFailed) {
          throw error;
        }
      }
    }
  }
}

/** Returns the standard AbortSignal reason, including a fallback for older runtimes. */
function getAbortReason(signal: AbortSignal): unknown {
  if (signal.reason !== undefined) {
    return signal.reason;
  }
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

/** Throws at a cancellation checkpoint. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw getAbortReason(signal);
  }
}
