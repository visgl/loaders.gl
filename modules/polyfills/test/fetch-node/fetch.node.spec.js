/* global fetch */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser, resolvePath} from '@loaders.gl/loader-utils';

const PLY_CUBE_ATT_URL = resolvePath('@loaders.gl/ply/test/data/cube_att.ply');

test('fetch polyfill (Node.js)#fetch()', async t => {
  if (!isBrowser) {
    const response = await fetch(PLY_CUBE_ATT_URL);
    t.ok(response.headers, 'fetch polyfill successfully returned headers under Node.js');
    const data = await response.text();
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});

test('fetch polyfill (Node.js)#fetch() ignores url query params when loading file', async t => {
  if (!isBrowser) {
    const response = await fetch(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
    const data = await response.text();
    // TODO - strip query params when doing stat in headers...
    // t.ok(response.headers, 'fetch polyfill successfully returned headers under Node.js');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});
