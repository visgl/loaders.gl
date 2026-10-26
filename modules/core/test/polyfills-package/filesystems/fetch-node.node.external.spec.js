// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LOADERS_GL_RAW_FIXTURE_URL} from 'test/common/remote-fixtures';
const {fetchNode} = globalThis.loaders || {};
const PLY_CUBE_ATT_URL = `${LOADERS_GL_RAW_FIXTURE_URL}modules/ply/test/data/cube_att.ply`;
const TEXT_URL = 'modules/core/test/polyfills-package/data/data.txt';
const TEXT_URL_GZIPPED = 'modules/core/test/polyfills-package/data/data.txt.gz';
test('polyfills#fetchNode() (NODE)', async () => {
  const response = await fetchNode(PLY_CUBE_ATT_URL);
  expect(
    response.headers,
    'fetchNode polyfill successfully returned headers under Node.js'
  ).toBeTruthy();
  const data = await response.arrayBuffer();
  expect(data, 'fetchNode polyfill successfully loaded data under Node.js').toBeTruthy();
});
test('polyfills#fetchNode() ignores url query params when loading file (NODE)', async () => {
  const response = await fetchNode(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
  const data = await response.text();
  expect(
    response.headers,
    'fetchNode polyfill successfully returned headers under Node.js'
  ).toBeTruthy();
  expect(data, 'fetchNode polyfill successfully loaded data under Node.js').toBeTruthy();
});
test('polyfills#fetchNode() error handling (NODE)', async () => {
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
});
test('polyfills#fetchNode() able to decompress .gz extension (NODE)', async () => {
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
});
