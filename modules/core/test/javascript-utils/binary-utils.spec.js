import test from 'tape-promise/tape';
import {toArrayBuffer, toDataView} from '@loaders.gl/core';

test('toArrayBuffer', t => {
  t.ok(toArrayBuffer, 'toArrayBuffer defined');
  t.end();
});

test('toDataView', t => {
  t.ok(toDataView, 'toDataView defined');
  t.end();
});
