import test from 'tape-promise/tape';
import {padTo4Bytes, copyArrayBuffer, copyToArray} from '@loaders.gl/loader-utils';

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
