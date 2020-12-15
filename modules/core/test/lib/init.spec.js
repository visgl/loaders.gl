// @ts-nocheck
/* global loaders */

import test from 'tape-promise/tape';
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

test('loaders has global version', t => {
  t.ok(loaders.version);
  t.ok(loaders.VERSION);
  t.equal(loaders.version, version);
  t.equal(loaders.VERSION, version);
  t.end();
});
