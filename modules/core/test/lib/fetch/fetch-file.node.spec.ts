import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';

const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const PLY_CUBE_ATT_SIZE = 853;
const TEXT_URL = '@loaders.gl/polyfills/test/data/data.txt';
const TEXT_URL_GZIPPED = '@loaders.gl/polyfills/test/data/data.txt.gz';
const TEXT_URL_WITH_REDIRECT =
  'https://unpkg.com/@loaders.gl/textures@beta/dist/libs/basis_encoder.js';
const REDIRECT_URL =
  'https://github.com/visgl/loaders.gl/raw/master/modules/polyfills/test/data/data.txt';

test('fetchFile() (NODE)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  expect(response.headers, 'fetchFile successfully returned headers under Node.js').toBeTruthy();

  const data = await response.arrayBuffer();
  expect(data, 'fetchFile successfully loaded data under Node.js').toBeTruthy();
});

test('fetchFile() ignores url query params when loading file (NODE)', async () => {
  const response = await fetchFile(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
  const data = await response.text();

  expect(response.headers, 'fetchFile successfully returned headers under Node.js').toBeTruthy();
  expect(data, 'fetchFile successfully loaded data under Node.js').toBeTruthy();
});

test.skip('fetchFile() error handling (NODE)', async () => {
  let response = await fetchFile('non-existent-file');
  expect(
    response.statusText.includes('ENOENT'),
    'fetch statusText forwards node ENOENT error'
  ).toBeTruthy();
  expect(response.ok, 'fetchFile fails cleanly on non-existent file').toBeFalsy();
  expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();

  response = await fetchFile('.');
  expect(
    response.statusText.includes('EISDIR'),
    'fetch statusText forwards node error'
  ).toBeTruthy();
  expect(response.ok, 'fetchFile fails cleanly on directory').toBeFalsy();
  expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();
});

test('fetchFile() able to handle "Accept-Encoding: gzip" (NODE)', async () => {
  const headers = {
    'Accept-Encoding': 'gzip'
  };
  const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
  const data = await response.text();

  expect(data.length, 'fetchFile data size as expected').toBe(PLY_CUBE_ATT_SIZE);
  expect(
    data,
    'fetchFile successfully loaded data under Node.js with "gzip" encoding'
  ).toBeTruthy();
});

test('fetchFile() able to handle "Accept-Encoding: br" (NODE)', async () => {
  const headers = {
    'Accept-Encoding': 'br'
  };
  const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
  const data = await response.text();

  expect(data.length === PLY_CUBE_ATT_SIZE, 'fetchFile data size as expected').toBeTruthy();
  expect(data, 'fetchFile successfully loaded data under Node.js with "br" encoding').toBeTruthy();
});

test('fetchFile() able to handle "Accept-Encoding: deflate"', async () => {
  const headers = {
    'Accept-Encoding': 'deflate'
  };
  const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
  const data = await response.text();

  expect(data.length === PLY_CUBE_ATT_SIZE, 'fetchFile data size as expected').toBeTruthy();
  expect(
    data,
    'fetchFile successfully loaded data under Node.js with "deflate" encoding'
  ).toBeTruthy();
});

test.skip('fetchFile() able to decompress .gz extension (NODE)', async () => {
  let response = await fetchFile(TEXT_URL);
  expect(response.ok, response.statusText).toBeTruthy();
  let data = await response.text();
  expect(data, 'fetchFile correctly read text file').toBe('123456');

  response = await fetchFile(TEXT_URL_GZIPPED);
  expect(response.ok, response.statusText).toBeTruthy();
  data = await response.text();
  expect(data, 'fetchFile correctly decompressed gzipped ".gz" file').toBe('123456');
});

test('fetchFile() should follow redirect if `followRedirect` option is true', async () => {
  const defaultFetchResponse = await fetchFile(REDIRECT_URL);
  expect(defaultFetchResponse.status).toBe(200);
  expect(await defaultFetchResponse.text()).toBe('123456');

  const defaultResponse = await fetchFile(REDIRECT_URL, {});
  expect(defaultResponse.status).toBe(200);
  expect(await defaultResponse.text()).toBe('123456');

  // @ts-ignore - TODO/ActionEngine
  const successResponse = await fetchFile(REDIRECT_URL, {followRedirect: true});
  expect(successResponse.status).toBe(200);
  expect(await successResponse.text()).toBe('123456');
});

test.skip('fetchFile() should follow redirect if header location doesn`t have protocol and origin', async () => {
  const defaultFetchResponse = await fetchFile(TEXT_URL_WITH_REDIRECT);
  expect(defaultFetchResponse.status).toBe(200);
});
