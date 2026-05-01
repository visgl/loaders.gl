import {expect, test} from 'vitest';
import {
  toArrayBuffer,
  concatenateArrayBuffers,
  concatenateTypedArrays
} from '@loaders.gl/loader-utils';
test('toArrayBuffer', () => {
  const typedArray = new Float32Array([0, 1, 2, 3]);
  let buffer = toArrayBuffer(typedArray);
  expect(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from typed array').toBeTruthy();
  buffer = toArrayBuffer(typedArray.buffer);
  expect(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from ArrayBuffer').toBeTruthy();
  // TODO - skipping as this uses Node.js Buffers
  // if (!isBrowser) {
  //   buffer = toArrayBuffer(Buffer.from(typedArray.buffer));
  //   t.ok(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from Buffer');
  // }
  buffer = toArrayBuffer('0123');
  expect(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from string').toBeTruthy();
  expect(() => toArrayBuffer({}), 'throws on unknown input').toThrow();
});
test('concatenateArrayBuffers', () => {
  const input1 = new Uint8Array([1, 2, 3]);
  const input2 = new Uint8Array([4, 5, 6]);
  const expected = new Uint8Array([1, 2, 3, 4, 5, 6]).buffer;
  let result = concatenateArrayBuffers(input1, input2);
  expect(result, 'types arrays concatenated as expected').toEqual(expected);
  result = concatenateArrayBuffers(input1.buffer, input2.buffer);
  expect(result, 'array buffers concatenated as expected').toEqual(expected);
  result = concatenateArrayBuffers();
  expect(result, 'zero array buffers concatenated as expected').toEqual(new ArrayBuffer(0));
  result = concatenateArrayBuffers(input1);
  expect(result, 'single array buffer concatenated as expected').toEqual(input1.buffer);
});
test('concatenateTypedArrays', () => {
  const array1 = new Int32Array(4);
  array1.set([-100, 101]);
  const array2 = new Int32Array([1, 2]);
  const array3 = new Int32Array([-300]);
  const result1 = concatenateTypedArrays(array1, array2, array3);
  const expectedResult = new Int32Array([-100, 101, 0, 0, 1, 2, -300]);
  expect(result1, 'Correct result of concatenation').toEqual(expectedResult);
  expect(result1.constructor.name, 'Correct output data type').toBe('Int32Array');
  const result2 = concatenateTypedArrays(new Int32Array(0), array2);
  expect(result2, 'Correct result of concatenation').toEqual(array2);
  expect(
    () => concatenateTypedArrays(),
    '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
  ).toThrow();
  expect(
    () => concatenateTypedArrays(array1),
    '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
  ).toThrow();
});
