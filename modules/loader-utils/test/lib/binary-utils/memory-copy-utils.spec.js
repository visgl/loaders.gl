import test from 'tape-promise/tape';
import {
  padTo4Bytes,
  copyArrayBuffer,
  copyToArray,
  concatenateArrayBuffers
} from '@loaders.gl/loader-utils';

test('padTo4Bytes', t => {
  t.ok(padTo4Bytes, 'padTo4Bytes defined');
  t.end();
});

test('toBuffer', t => {
  t.ok(copyArrayBuffer, 'copyArrayBuffer defined');
  t.end();
});

test('copyToArray', t => {
  t.ok(copyToArray, 'copyToArray defined');
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
