import {isBrowser} from '../utils/globals';
import {concatenateArrayBuffers} from '../binary-utils/memory-copy-utils';

export function getStreamIterator(stream) {
  // NODE 10+: stream is an asyncIterator
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream;
  }

  // WhatWG: stream is supposed to have a `getIterator` method
  if (typeof stream.getIterator === 'function') {
    return stream.getIterator();
  }

  return isBrowser ? makeBrowserStreamIterator(stream) : makeNodeStreamIterator(stream);
}

// BROWSER IMPLEMENTATION
// See https://jakearchibald.com/2017/async-iterators-and-generators/#making-streams-iterate

async function* makeBrowserStreamIterator(stream) {
  // In the brower, we first need to get a lock on the stream
  const reader = stream.getReader();

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Read from the stream
      const {done, value} = await reader.read();
      // Exit if we're done
      if (done) {
        return;
      }
      // Else yield the chunk
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// NODE <10 IMPLEMENTATION
// See https://github.com/bustle/streaming-iterables, MIT license

async function* makeNodeStreamIterator(stream) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = stream.read();
    if (data !== null) {
      yield data;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (stream._readableState.ended) {
      return;
    }
    await onceReadable(stream);
  }
}

async function onceReadable(stream) {
  return new Promise(resolve => {
    stream.once('readable', resolve);
  });
}

// TODO - remove? can this be handled via corresponding AsyncIterator function?
export function concatenateReadStream(readStream) {
  let arrayBuffer = new ArrayBuffer();
  let string = '';

  return new Promise((resolve, reject) => {
    readStream.data(chunk => {
      if (typeof chunk === 'string') {
        string += chunk;
      } else {
        arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
      }
    });
    readStream.on('error', error => reject(error));

    readStream.on('end', () => {
      if (readStream.complete) {
        resolve(arrayBuffer || string);
      } else {
        reject('The connection was terminated while the message was still being sent');
      }
    });
  });
}
