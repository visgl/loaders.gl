import test from 'tape-promise/tape';

import {
  makeChunkIterator,
  concatenateChunksAsync
} from '@loaders.gl/core/iterator-utils/chunk-iteration';
import {textEncoderAsyncIterator} from '@loaders.gl/core/iterator-utils/async-iteration';

/* global setTimeout */
const setTimeoutPromise = timeout => new Promise(resolve => setTimeout(resolve, timeout));

async function* asyncTexts() {
  await setTimeoutPromise(10);
  yield 'line 1\nline';
  await setTimeoutPromise(10);
  yield ' 2\nline 3\n';
  await setTimeoutPromise(10);
  yield 'line 4';
}

function asyncArrayBuffers() {
  return textEncoderAsyncIterator(asyncTexts());
}

test('concatenateChunksAsync', async t => {
  const RESULT = `line 1\nline 2\nline 3\nline 4`;

  const text = await concatenateChunksAsync(asyncTexts());
  t.is(text, RESULT, 'returns concatenated string');

  const arraybuffer = await concatenateChunksAsync(asyncArrayBuffers());
  t.ok(arraybuffer instanceof Uint8Array, 'returns buffer');
  /* global TextEncoder */
  t.deepEqual(arraybuffer, new TextEncoder().encode(RESULT), 'returns concatenated arraybuffer');

  t.end();
});

test('makeChunkIterator#string', async t => {
  const bigString = '123456';
  const results = ['12', '34', '56'];

  const iterator = makeChunkIterator(bigString, {chunkSize: 2});

  for (const chunk of iterator) {
    t.equal(chunk, results.shift());
  }

  t.end();
});

test('makeChunkIterator#arrayBuffer', async t => {
  const bigString = new ArrayBuffer(6);

  const iterator = makeChunkIterator(bigString, {chunkSize: 2});

  for (const chunk of iterator) {
    t.ok(chunk instanceof ArrayBuffer);
    t.equal(chunk.byteLength, 2);
  }

  t.end();
});
