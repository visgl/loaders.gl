/* global fetch */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser} from '@loaders.gl/core';

const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const PLY_CUBE_ATT_SIZE = 853;

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

test('fetch polyfill (Node.js)#fetch() able to handle "Accept-Encoding: gzip"', async t => {
  if (!isBrowser) {
    const headers = {
      'Accept-Encoding': 'gzip'
    };
    // Test will pass even if server will refuse to encode into 'gzip' and just return plaintext
    // In case of GitHub URL, it's honoring gzip and properly returning compressed data
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "gzip" encoding');
  }
  t.end();
});

test('fetch polyfill (Node.js)#fetch() able to handle "Accept-Encoding: br"', async t => {
  if (!isBrowser) {
    const headers = {
      'Accept-Encoding': 'br'
    };
    // Test will pass even if server will refuse to encode into 'br' and just return plaintext
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "br" encoding');
  }
  t.end();
});

test('fetch polyfill (Node.js)#fetch() able to handle "Accept-Encoding: deflate"', async t => {
  if (!isBrowser) {
    const headers = {
      'Accept-Encoding': 'deflate'
    };
    // Test will pass even if server will refuse to encode into 'deflate' and just return plaintext
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "deflate" encoding');
  }
  t.end();
});
