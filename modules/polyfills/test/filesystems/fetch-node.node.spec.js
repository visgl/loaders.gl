import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
const {fetchNode} = globalThis.loaders || {};
const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const TEXT_URL = `@loaders.gl/polyfills/test/data/data.txt`;
const TEXT_URL_GZIPPED = `@loaders.gl/polyfills/test/data/data.txt.gz`;
test('polyfills#fetchNode() (NODE)', async () => {
  if (!isBrowser) {
    const response = await fetchNode(PLY_CUBE_ATT_URL);
    expect(
      response.headers,
      'fetchNode polyfill successfully returned headers under Node.js'
    ).toBeTruthy();
    const data = await response.arrayBuffer();
    expect(data, 'fetchNode polyfill successfully loaded data under Node.js').toBeTruthy();
  }
});
test('polyfills#fetchNode() ignores url query params when loading file (NODE)', async () => {
  if (!isBrowser) {
    const response = await fetchNode(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
    const data = await response.text();
    expect(
      response.headers,
      'fetchNode polyfill successfully returned headers under Node.js'
    ).toBeTruthy();
    expect(data, 'fetchNode polyfill successfully loaded data under Node.js').toBeTruthy();
  }
});
test('polyfills#fetchNode() error handling (NODE)', async () => {
  if (!isBrowser) {
    let response = await fetchNode('non-existent-file');
    console.log(response.statusText);
    expect(
      response.statusText.includes('ENOENT'),
      'fetchNode statusText forwards node ENOENT error'
    ).toBeTruthy();
    expect(response.ok, 'fetchNode polyfill fails cleanly on non-existent file').toBeFalsy();
    expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();
    response = await fetchNode('.');
    console.log(response.statusText);
    expect(
      response.statusText.includes('EISDIR'),
      'fetchNode statusText forwards node error'
    ).toBeTruthy();
    expect(response.ok, 'fetchNode polyfill fails cleanly on directory').toBeFalsy();
    expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();
  }
});
test('polyfills#fetchNode() able to decompress .gz extension (NODE)', async () => {
  if (!isBrowser) {
    const textResponse = await fetchNode(TEXT_URL);
    expect(textResponse.ok, textResponse.statusText).toBeTruthy();
    const textData = await textResponse.text();
    expect(textData, 'fetchNode polyfill correctly read text file').toBe('123456');
    const gzippedResponse = await fetchNode(TEXT_URL_GZIPPED);
    expect(gzippedResponse.ok, gzippedResponse.statusText).toBeTruthy();
    const gzippedData = await gzippedResponse.text();
    expect(gzippedData, 'fetchNode polyfill correctly decompressed gzipped ".gz" file').toBe(
      textData
    );
  }
});
