/* global Buffer */
import test from 'tape-promise/tape';
import {toArrayBuffer} from '@loaders.gl/core';

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
