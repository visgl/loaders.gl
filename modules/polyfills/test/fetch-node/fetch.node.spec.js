/* global fetch */
import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import '@loaders.gl/polyfills/';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';

test('fetch polyfill (Node.js)#fetch()', async t => {
  if (!isBrowser) {
    const response = await fetch(PLY_CUBE_ATT_URL);
    const data = await response.text();
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});
