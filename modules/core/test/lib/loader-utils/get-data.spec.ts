// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getArrayBufferOrStringFromDataSync,
  getArrayBufferOrStringFromData,
  getArrayBufferFromData,
  getAsyncIterableFromData,
  getReadableStream
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

test('getArrayBufferOrStringFromData handles Blob, Response, stream, and invalid inputs', async () => {
  await expect(getArrayBufferOrStringFromData(new Blob(['hello']), JSONLoader, {})).resolves.toBe(
    'hello'
  );
  await expect(getArrayBufferOrStringFromData(new Response('world'), JSONLoader, {})).resolves.toBe(
    'world'
  );
  const binary = await getArrayBufferOrStringFromData(new Response('abc'), BinaryLoader, {});
  expect(new TextDecoder().decode(binary as ArrayBuffer)).toBe('abc');

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2]));
      controller.enqueue(new Uint8Array([3]));
      controller.close();
    }
  });
  await expect(getArrayBufferOrStringFromData(stream, BinaryLoader, {})).resolves.toEqual(
    new Uint8Array([1, 2, 3]).buffer
  );
  await expect(getArrayBufferOrStringFromData({} as never, BinaryLoader, {})).rejects.toThrow(
    'Cannot convert supplied data type'
  );
});

test('getArrayBufferFromData preserves all supported binary input forms', async () => {
  expect(new TextDecoder().decode(await getArrayBufferFromData('text', {}))).toBe('text');

  const backing = new Uint8Array([9, 1, 2, 8]);
  await expect(getArrayBufferFromData(backing.subarray(1, 3), {})).resolves.toEqual(
    new Uint8Array([1, 2]).buffer
  );
  await expect(getArrayBufferFromData(new Blob([new Uint8Array([3, 4])]), {})).resolves.toEqual(
    new Uint8Array([3, 4]).buffer
  );
  await expect(getArrayBufferFromData(new Response(new Uint8Array([5, 6])), {})).resolves.toEqual(
    new Uint8Array([5, 6]).buffer
  );

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([7]));
      controller.enqueue(new Uint8Array([8]));
      controller.close();
    }
  });
  await expect(getArrayBufferFromData(stream, {})).resolves.toEqual(new Uint8Array([7, 8]).buffer);
  await expect(getArrayBufferFromData({} as never, {})).rejects.toThrow(
    'Cannot convert supplied data type'
  );
});

test('getAsyncIterableFromData resolves promises, responses, blobs, and streams', async () => {
  const promised = await getAsyncIterableFromData(
    Promise.resolve(new Uint8Array([1, 2]).buffer),
    {}
  );
  expect(Array.from(promised as Iterable<ArrayBuffer>)).toHaveLength(1);

  const responseIterator = await getAsyncIterableFromData(new Response('response'), {});
  const responseChunks: ArrayBufferLike[] = [];
  for await (const chunk of responseIterator) responseChunks.push(chunk as ArrayBufferLike);
  expect(responseChunks.length).toBeGreaterThan(0);

  const blobIterator = await getAsyncIterableFromData(new Blob(['blob']), {});
  const blobChunks: ArrayBufferLike[] = [];
  for await (const chunk of blobIterator) blobChunks.push(chunk as ArrayBufferLike);
  expect(blobChunks.length).toBeGreaterThan(0);

  await expect(getAsyncIterableFromData(new Response(null), {})).rejects.toThrow(
    'Cannot convert supplied data type'
  );
});

test('getReadableStream preserves streams and unwraps responses and blobs', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1]));
      controller.close();
    }
  });
  await expect(getReadableStream(stream)).resolves.toBe(stream);

  const response = new Response('response');
  await expect(getReadableStream(response)).resolves.toBe(response.body);
  await expect(getReadableStream(new Blob(['blob']))).resolves.toBeInstanceOf(ReadableStream);
  await expect(getReadableStream(new Response(null))).rejects.toThrow(
    'Cannot convert supplied data type'
  );
});
