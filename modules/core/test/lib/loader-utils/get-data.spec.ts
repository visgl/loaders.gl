import {expect, test} from 'vitest';
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
test('parseWithLoader#getArrayBufferOrStringFromDataSync', () => {
  const string = 'line 1\nline 2';
  const buffer = new TextEncoder().encode(string);
  let result = getArrayBufferOrStringFromDataSync(string, JSONLoader, {});
  expect(result, 'returns correct result').toBe(string);
  result = getArrayBufferOrStringFromDataSync(buffer, BinaryLoader, {});
  expect(result, 'returns correct result').toBe(buffer.buffer);
  result = getArrayBufferOrStringFromDataSync(buffer, JSONLoader, {});
  expect(result, 'returns correct result').toBe(string);
  expect(() => getArrayBufferOrStringFromDataSync(string, BinaryLoader, {})).toThrow();
});
test('parseWithLoader#getArrayBufferOrStringFromDataSync(ArrayBufferLike)', () => {
  if (typeof SharedArrayBuffer === 'undefined') {
    console.log('SharedArrayBuffer unavailable in environment');
    return;
  }
  const sharedArrayBuffer = new SharedArrayBuffer(6);
  const view = new Uint8Array(sharedArrayBuffer);
  view.set([97, 98, 99, 100, 101, 102]);
  const stringResult = getArrayBufferOrStringFromDataSync(sharedArrayBuffer, JSONLoader, {});
  expect(stringResult, 'decodes SharedArrayBuffer to string').toBe('abcdef');
  const binaryResult = getArrayBufferOrStringFromDataSync(sharedArrayBuffer, BinaryLoader, {});
  expect(
    new Uint8Array(binaryResult as ArrayBuffer),
    'copies SharedArrayBuffer to ArrayBuffer'
  ).toEqual(view);
});
test('parseWithLoader#getArrayBufferOrStringFromDataSync(embedded arrays)', () => {
  const string = 'line 1\nline 2';
  const embeddedString = `}}}${string}{{{`;
  const typedArray = new TextEncoder().encode(embeddedString);
  const typedArrayWithOffset = new Uint8Array(typedArray.buffer, 3, string.length);
  // Check that our offset array is correctly set up
  const extractedString = new TextDecoder().decode(typedArrayWithOffset);
  expect(extractedString).toBe(string);
  let result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, JSONLoader, {});
  expect(result, 'typedArrayWithOffset to string returns correct result').toBe(string);
  result = getArrayBufferOrStringFromDataSync(typedArrayWithOffset, BinaryLoader, {});
  expect(
    // @ts-ignore
    new Uint8Array(result),
    'typedArrayWithOffset to ArrayBuffer returns correct result'
  ).toEqual(typedArrayWithOffset);
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
test('parseWithLoader#getAsyncIterableFromData', async () => {
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
    expect(isIterator(result), 'returns iterator').toBeTruthy();
  }
  // @ts-ignore
  await expect(
    getAsyncIterableFromData({}),
    'object conversion to iterator fails'
  ).rejects.toBeDefined();
});
test('parseWithLoader#getArrayBufferOrStringFromData(SharedArrayBuffer iterables)', async () => {
  if (typeof SharedArrayBuffer === 'undefined') {
    console.log('SharedArrayBuffer unavailable in environment');
    return;
  }
  const sharedArrayBuffer = new SharedArrayBuffer(10);
  const uint16View = new Uint16Array(sharedArrayBuffer);
  uint16View.set([0x4142, 0x4344, 0x4546, 0x4748, 0x494a]);
  const iterator = (function* generate() {
    yield uint16View.subarray(1, 4);
  })();
  const result = await getArrayBufferOrStringFromData(iterator, BinaryLoader, {});
  expect(new Uint16Array(result as ArrayBuffer)).toEqual(uint16View.subarray(1, 4));
});
