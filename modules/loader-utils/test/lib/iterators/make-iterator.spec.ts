import {expect, test} from 'vitest';
import {fetchFile, makeIterator} from '@loaders.gl/core';
import {concatenateArrayBuffersAsync, makeTextEncoderIterator} from '@loaders.gl/loader-utils';
import {flushMicrotasks} from '@loaders.gl/test-utils/vitest';

async function* asyncTexts() {
  await flushMicrotasks();
  yield 'line 1\nline';
  await flushMicrotasks();
  yield ' 2\nline 3\n';
  await flushMicrotasks();
  yield 'line 4';
}
function asyncArrayBuffers() {
  return makeTextEncoderIterator(asyncTexts());
}
test('concatenateArrayBuffersAsync', async () => {
  const RESULT = 'line 1\nline 2\nline 3\nline 4';
  const arraybuffer = await concatenateArrayBuffersAsync(asyncArrayBuffers());
  expect(arraybuffer instanceof ArrayBuffer, 'returns ArrayBuffer').toBeTruthy();
  expect(arraybuffer, 'returns concatenated ArrayBuffer').toEqual(
    new TextEncoder().encode(RESULT).buffer
  );
});
test('makeIterator#string', async () => {
  const bigString = '123456';
  const results = ['12', '34', '56'];
  const iterator = makeIterator(bigString, {chunkSize: 2});
  for await (const chunk of iterator) {
    expect(new TextDecoder().decode(chunk)).toBe(results.shift());
  }
});
test('makeIterator#arrayBuffer', async () => {
  const bigString = new ArrayBuffer(6);
  const iterator = makeIterator(bigString, {chunkSize: 2});
  for await (const chunk of iterator) {
    expect(chunk instanceof ArrayBuffer).toBeTruthy();
    expect(chunk.byteLength).toBe(2);
  }
});
const DATA_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
test('makeIterator(fetch)#async iterate', async () => {
  const response = await fetchFile(DATA_URL);
  const stream = response.body;
  expect(stream).toBeTruthy();
  if (stream) {
    const asyncIterator = makeIterator(stream);
    expect(asyncIterator).toBeTruthy();
    for await (const arrayBuffer of asyncIterator) {
      expect(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`).toBeTruthy();
    }
  }
});
