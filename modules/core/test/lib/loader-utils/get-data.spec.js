/* global TextEncoder, TextDecoder, Buffer */
import test from 'tape-promise/tape';
import {
  getArrayBufferOrStringFromDataSync,
  getAsyncIteratorFromData,
  getIteratorFromData
} from '@loaders.gl/core/lib/loader-utils/get-data';

import {isIterator} from '@loaders.gl/core';
import {isBrowser} from '@loaders.gl/loader-utils';

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

test('parseWithLoader#getArrayBufferOrStringFromDataSync(embedded arrays/buffers)', t => {
  const string = 'line 1\nline 2';
  const embeddedString = `}}}${string}{{{`;

  const typedArray = new TextEncoder().encode(embeddedString);
  const typedArrayWithOffset = new Uint8Array(typedArray.buffer, 3, string.length);

  // Check that our offset array is correctly set up
  let extractedString = new TextDecoder().decode(typedArrayWithOffset);
  t.equals(extractedString, string);

  let result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, {text: true});
  t.equals(result, string, 'typedArrayWithOffset to string returns correct result');

  result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, {text: false});
  t.deepEquals(
    new Uint8Array(result),
    typedArrayWithOffset,
    'typedArrayWithOffset to ArrayBuffer returns correct result'
  );

  if (!isBrowser) {
    const nodeBufferWithOffset = Buffer.from(typedArray.buffer, 3, string.length);

    // Check that our offset array is correctly set up
    extractedString = nodeBufferWithOffset.toString();
    t.equals(extractedString, string);

    result = getArrayBufferOrStringFromDataSync(nodeBufferWithOffset, {text: true});
    t.equals(result, string, 'BufferWithOffset to string returns correct result');

    result = getArrayBufferOrStringFromDataSync(nodeBufferWithOffset, {text: false});
    t.deepEquals(
      new Uint8Array(result),
      typedArrayWithOffset,
      'BufferWithOffset to ArrayBuffer returns correct result'
    );
  }

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
