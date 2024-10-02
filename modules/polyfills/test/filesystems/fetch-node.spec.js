import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';

const {fetchNode} = globalThis.loaders || {};

const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const TEXT_URL = `@loaders.gl/polyfills/test/data/data.txt`;
const TEXT_URL_GZIPPED = `@loaders.gl/polyfills/test/data/data.txt.gz`;

test('polyfills#fetchNode() (NODE)', async (t) => {
  if (!isBrowser) {
    const response = await fetchNode(PLY_CUBE_ATT_URL);
    t.ok(response.headers, 'fetchNode polyfill successfully returned headers under Node.js');
    const data = await response.arrayBuffer();
    t.ok(data, 'fetchNode polyfill successfully loaded data under Node.js');
  }
  t.end();
});

test('polyfills#fetchNode() ignores url query params when loading file (NODE)', async (t) => {
  if (!isBrowser) {
    const response = await fetchNode(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
    const data = await response.text();
    t.ok(response.headers, 'fetchNode polyfill successfully returned headers under Node.js');
    t.ok(data, 'fetchNode polyfill successfully loaded data under Node.js');
  }
  t.end();
});

test('polyfills#fetchNode() error handling (NODE)', async (t) => {
  if (!isBrowser) {
    let response = await fetchNode('non-existent-file');
    t.comment(response.statusText);
    t.ok(response.statusText.includes('ENOENT'), 'fetchNode statusText forwards node ENOENT error');
    t.notOk(response.ok, 'fetchNode polyfill fails cleanly on non-existent file');
    t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');

    response = await fetchNode('.');
    t.comment(response.statusText);
    t.ok(response.statusText.includes('EISDIR'), 'fetchNode statusText forwards node error');
    t.notOk(response.ok, 'fetchNode polyfill fails cleanly on directory');
    t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');
  }
  t.end();
});

// TODO v4.0 restore this test
test.skip('polyfills#fetchNode() able to decompress .gz extension (NODE)', async (t) => {
  if (!isBrowser) {
    let response = await fetchNode(TEXT_URL);
    t.ok(response.ok, response.statusText);
    let data = await response.text();
    t.equal(data, '123456', 'fetchNode polyfill correctly read text file');

    if (!isBrowser) {
      response = await fetchNode(TEXT_URL_GZIPPED);
      t.ok(response.ok, response.statusText);
      data = await response.text();
      t.equal(data, '123456', 'fetchNode polyfill correctly decompressed gzipped ".gz" file');
    }
  }
  t.end();
});
