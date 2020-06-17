/* global Buffer */
import test from 'tape-promise/tape';
import {toArrayBuffer, concatenateArrayBuffers} from '@loaders.gl/loader-utils';

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
