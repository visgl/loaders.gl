import test from 'tape-promise/tape';
import {
  toArrayBuffer,
  concatenateArrayBuffers,
  concatenateTypedArrays
} from '@loaders.gl/loader-utils';

test('toArrayBuffer', t => {
  const typedArray = new Float32Array([0, 1, 2, 3]);

  let buffer = toArrayBuffer(typedArray);
  t.ok(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from typed array');

  buffer = toArrayBuffer(typedArray.buffer);
  t.ok(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from ArrayBuffer');

  buffer = toArrayBuffer(Buffer.from(typedArray.buffer));
  t.ok(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from Buffer');

  buffer = toArrayBuffer('0123');
  t.ok(buffer instanceof ArrayBuffer, 'returns ArrayBuffer from string');

  t.throws(() => toArrayBuffer({}), 'throws on unknown input');

  t.end();
});

test('concatenateArrayBuffers', t => {
  const input1 = new Uint8Array([1, 2, 3]);
  const input2 = new Uint8Array([4, 5, 6]);
  const expected = new Uint8Array([1, 2, 3, 4, 5, 6]).buffer;

  let result = concatenateArrayBuffers(input1, input2);
  t.deepEquals(result, expected, 'types arrays concatenated as expected');

  result = concatenateArrayBuffers(input1.buffer, input2.buffer);
  t.deepEquals(result, expected, 'array buffers concatenated as expected');

  result = concatenateArrayBuffers();
  t.deepEquals(result, new ArrayBuffer(0), 'zero array buffers concatenated as expected');

  result = concatenateArrayBuffers(input1);
  t.deepEquals(result, input1.buffer, 'single array buffer concatenated as expected');

  t.end();
});

test('concatenateTypedArrays', t => {
  const array1 = new Int32Array(4);
  array1.set([-100, 101]);
  const array2 = new Int32Array([1, 2]);
  const array3 = new Int32Array([-300]);
  const result1 = concatenateTypedArrays(array1, array2, array3);
  const expectedResult = new Int32Array([-100, 101, 0, 0, 1, 2, -300]);
  t.deepEqual(result1, expectedResult, 'Correct result of concatenation');
  t.equal(result1.constructor.name, 'Int32Array', 'Correct output data type');

  const result2 = concatenateTypedArrays(new Int32Array(0), array2);
  t.deepEqual(result2, array2, 'Correct result of concatenation');

  t.throws(
    () => concatenateTypedArrays(),
    '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
  );
  t.throws(
    () => concatenateTypedArrays(array1),
    '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
  );
  t.end();
});
