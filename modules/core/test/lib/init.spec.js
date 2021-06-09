// /* global loaders */
// @ts-nocheck

import test from 'tape-promise/tape';
// import {isBrowser} from '@loaders.gl/core';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

test('loaders has global version', (t) => {
  // TODO(ib): babel/register has issue with globals
  // if (isBrowser) {
  //   t.ok(loaders.VERSION);
  //   t.equal(loaders.VERSION, version);
  // }
  t.end();
});
