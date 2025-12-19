// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  getArrayBufferOrStringFromDataSync,
  getArrayBufferOrStringFromData,
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

test('parseWithLoader#getArrayBufferOrStringFromDataSync(ArrayBufferLike)', (t) => {
  if (typeof SharedArrayBuffer === 'undefined') {
    t.comment('SharedArrayBuffer unavailable in environment');
    t.end();
    return;
  }

  const sharedArrayBuffer = new SharedArrayBuffer(6);
  const view = new Uint8Array(sharedArrayBuffer);
  view.set([97, 98, 99, 100, 101, 102]);

  const stringResult = getArrayBufferOrStringFromDataSync(sharedArrayBuffer, JSONLoader, {});
  t.equals(stringResult, 'abcdef', 'decodes SharedArrayBuffer to string');

  const binaryResult = getArrayBufferOrStringFromDataSync(sharedArrayBuffer, BinaryLoader, {});
  t.deepEquals(
    new Uint8Array(binaryResult as ArrayBuffer),
    view,
    'copies SharedArrayBuffer to ArrayBuffer'
  );

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
    new DataView(new Uint8Array([1, 2, 3, 4]).buffer),
    (async function* generator() {
      yield new ArrayBuffer(0);
    })(),
    new Set([new Uint8Array([4, 5]).subarray(0, 1), new ArrayBuffer(0)]).values()
  ];

  for (const testCase of TESTS) {
    const result = await getAsyncIterableFromData(testCase, {});
    t.ok(isIterator(result), 'returns iterator');
  }

  // @ts-ignore
  t.rejects(async () => await getAsyncIterableFromData({}), 'object conversion to iterator fails');

  t.end();
});

test('parseWithLoader#getArrayBufferOrStringFromData(SharedArrayBuffer iterables)', async (t) => {
  if (typeof SharedArrayBuffer === 'undefined') {
    t.comment('SharedArrayBuffer unavailable in environment');
    t.end();
    return;
  }

  const sharedArrayBuffer = new SharedArrayBuffer(10);
  const uint16View = new Uint16Array(sharedArrayBuffer);
  uint16View.set([0x4142, 0x4344, 0x4546, 0x4748, 0x494a]);

  const iterator = (function* generate() {
    yield uint16View.subarray(1, 4);
  })();

  const result = await getArrayBufferOrStringFromData(iterator, BinaryLoader, {});
  t.deepEquals(new Uint16Array(result as ArrayBuffer), uint16View.subarray(1, 4));

  t.end();
});
