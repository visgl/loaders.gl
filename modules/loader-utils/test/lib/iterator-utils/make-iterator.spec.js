import test from 'tape-promise/tape';
import {fetchFile, makeIterator} from '@loaders.gl/core';
import {concatenateChunksAsync, makeTextEncoderIterator} from '@loaders.gl/loader-utils';

const setTimeoutPromise = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

async function* asyncTexts() {
  await setTimeoutPromise(10);
  yield 'line 1\nline';
  await setTimeoutPromise(10);
  yield ' 2\nline 3\n';
  await setTimeoutPromise(10);
  yield 'line 4';
}

function asyncArrayBuffers() {
  return makeTextEncoderIterator(asyncTexts());
}

test('concatenateChunksAsync', async (t) => {
  const RESULT = `line 1\nline 2\nline 3\nline 4`;

  // const text = await concatenateChunksAsync(asyncTexts());
  // t.is(text, RESULT, 'returns concatenated string');

  const arraybuffer = await concatenateChunksAsync(asyncArrayBuffers());
  t.ok(arraybuffer instanceof ArrayBuffer, 'returns ArrayBuffer');
  t.deepEqual(
    arraybuffer,
    new TextEncoder().encode(RESULT).buffer,
    'returns concatenated ArrayBuffer'
  );

  t.end();
});

test('makeIterator#string', async (t) => {
  const bigString = '123456';
  const results = ['12', '34', '56'];

  const iterator = makeIterator(bigString, {chunkSize: 2});

  for (const chunk of iterator) {
    t.equal(new TextDecoder().decode(chunk), results.shift());
  }

  t.end();
});

test('makeIterator#arrayBuffer', async (t) => {
  const bigString = new ArrayBuffer(6);

  const iterator = makeIterator(bigString, {chunkSize: 2});

  for (const chunk of iterator) {
    t.ok(chunk instanceof ArrayBuffer);
    t.equal(chunk.byteLength, 2);
  }

  t.end();
});

const DATA_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';

test('makeIterator(fetch)#async iterate', async (t) => {
  const response = await fetchFile(DATA_URL);
  const stream = await response.body;
  t.ok(stream);

  if (stream) {
    const asyncIterator = makeIterator(stream);
    t.ok(asyncIterator);

    for await (const arrayBuffer of asyncIterator) {
      t.ok(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`);
    }
  }

  t.end();
});
