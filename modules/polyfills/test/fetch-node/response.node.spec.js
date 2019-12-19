// Based on https://github.com/github/fetch under MIT license

/* global Response */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {resolvePath} from '@loaders.gl/core';

const PLY_CUBE_ATT_URL = resolvePath('@loaders.gl/ply/test/data/cube_att.ply');

// https://fetch.spec.whatwg.org/#response-class
// Run the tests both under browser and Node (ensures they conform to built-in)
test('constructor response', async t => {
  const response = new Response(PLY_CUBE_ATT_URL, {});

  t.equals(response.status, 200);
  t.equals(response.url, PLY_CUBE_ATT_URL);
  t.ok(response.ok);

  t.end();
});
