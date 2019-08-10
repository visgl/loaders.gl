/* global TextEncoder */
import test from 'tape-promise/tape';
import {
  getArrayBufferOrStringFromDataSync,
  getAsyncIteratorFromData,
  getIteratorFromData
} from '@loaders.gl/core/lib/loader-utils/get-data';

import {isIterator} from '@loaders.gl/core';

test('parseWithLoader#getArrayBufferOrStringFromDataSync', t => {
  const string = 'line 1\nline 2';
  const buffer = new TextEncoder().encode(string);

  let result = getArrayBufferOrStringFromDataSync(string, {text: true});
  t.is(result, string, 'returns correct result');

  result = getArrayBufferOrStringFromDataSync(buffer, {binary: true});
  t.is(result, buffer.buffer, 'returns correct result');

  result = getArrayBufferOrStringFromDataSync(buffer, {text: true});
  t.is(result, string, 'returns correct result');

  t.throws(() => getArrayBufferOrStringFromDataSync(string, {binary: true}));

  t.end();
});

test('parseWithLoader#getIteratorFromData', t => {
  const TESTS = [new Float32Array([1, 2, 3]), [1, 2, 3], new Set([1, 2, 3]).entries()];

  for (const testCase of TESTS) {
    const result = getIteratorFromData(testCase);
    t.ok(isIterator(result), 'returns iterator');
  }

  t.throws(() => getIteratorFromData({}));

  t.end();
});

test('parseWithLoader#getAsyncIteratorFromData', t => {
  const TESTS = [
    (async function* generator() {
      yield 1;
    })(),
    new Set([1, 2, 3]).entries()
  ];

  for (const testCase of TESTS) {
    const result = getAsyncIteratorFromData(testCase);
    t.ok(isIterator(result), 'returns iterator');
  }

  t.throws(() => getAsyncIteratorFromData({}));

  t.end();
});
