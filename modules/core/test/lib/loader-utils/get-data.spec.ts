// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  getArrayBufferOrStringFromDataSync,
  getAsyncIterableFromData
} from '@loaders.gl/core/lib/loader-utils/get-data';

import {isIterator, JSONLoader} from '@loaders.gl/core';

const BinaryLoader = {
  ...JSONLoader,
  text: false,
  binary: true
};

test('parseWithLoader#getArrayBufferOrStringFromDataSync', (t) => {
  const string = 'line 1\nline 2';
  const buffer = new TextEncoder().encode(string);

  let result = getArrayBufferOrStringFromDataSync(string, JSONLoader, {});
  t.is(result, string, 'returns correct result');

  result = getArrayBufferOrStringFromDataSync(buffer, BinaryLoader, {});
  t.is(result, buffer.buffer, 'returns correct result');

  result = getArrayBufferOrStringFromDataSync(buffer, JSONLoader, {});
  t.is(result, string, 'returns correct result');

  t.throws(() => getArrayBufferOrStringFromDataSync(string, BinaryLoader, {}));

  t.end();
});

test('parseWithLoader#getArrayBufferOrStringFromDataSync(embedded arrays)', (t) => {
  const string = 'line 1\nline 2';
  const embeddedString = `}}}${string}{{{`;

  const typedArray = new TextEncoder().encode(embeddedString);
  const typedArrayWithOffset = new Uint8Array(typedArray.buffer, 3, string.length);

  // Check that our offset array is correctly set up
  const extractedString = new TextDecoder().decode(typedArrayWithOffset);
  t.equals(extractedString, string);

  let result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, JSONLoader, {});
  t.equals(result, string, 'typedArrayWithOffset to string returns correct result');

  result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, BinaryLoader, {});
  t.deepEquals(
    // @ts-ignore
    new Uint8Array(result),
    typedArrayWithOffset,
    'typedArrayWithOffset to ArrayBuffer returns correct result'
  );

  t.end();
});

// TODO - skip because of Node.js Bbuffer dependency
// test('parseWithLoader#getArrayBufferOrStringFromDataSync(embedded buffers)', (t) => {
//   if (!isBrowser) {
//     const string = 'line 1\nline 2';
//     const embeddedString = `}}}${string}{{{`;

//     const typedArray = new TextEncoder().encode(embeddedString);
//     const typedArrayWithOffset = new Uint8Array(typedArray.buffer, 3, string.length);

//     // Check that our offset array is correctly set up
//     let extractedString = new TextDecoder().decode(typedArrayWithOffset);
//     t.equals(extractedString, string);

//     const nodeBufferWithOffset = Buffer.from(typedArray.buffer, 3, string.length);

//     // Check that our offset array is correctly set up
//     extractedString = nodeBufferWithOffset.toString();
//     t.equals(extractedString, string);

//     let result = getArrayBufferOrStringFromDataSync(nodeBufferWithOffset, JSONLoader, {});
//     t.equals(result, string, 'BufferWithOffset to string returns correct result');

//     result = getArrayBufferOrStringFromDataSync(nodeBufferWithOffset, BinaryLoader, {});
//     t.deepEquals(
//       // @ts-ignore
//       new Uint8Array(result),
//       typedArrayWithOffset,
//       'BufferWithOffset to ArrayBuffer returns correct result'
//     );
//   }

//   t.end();
// });

test('parseWithLoader#getAsyncIterableFromData', async (t) => {
  const TESTS = [
    new Float32Array([1, 2, 3]).buffer,
    (async function* generator() {
      yield new ArrayBuffer(0);
    })(),
    new Set([new ArrayBuffer(0), new ArrayBuffer(0)]).values()
  ];

  for (const testCase of TESTS) {
    const result = await getAsyncIterableFromData(testCase, {});
    t.ok(isIterator(result), 'returns iterator');
  }

  // @ts-ignore
  t.rejects(async () => await getAsyncIterableFromData({}), 'object conversion to iterator fails');

  t.end();
});
