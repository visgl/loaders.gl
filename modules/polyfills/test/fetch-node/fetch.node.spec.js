import {expect, test} from 'vitest';
import {isBrowser, fetchFile} from '@loaders.gl/core';
const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const PLY_CUBE_ATT_SIZE = 853;
const TEXT_URL = `@loaders.gl/polyfills/test/data/data.txt`;
const TEXT_URL_GZIPPED = `@loaders.gl/polyfills/test/data/data.txt.gz`;
// Request of this url returns location like "/@loaders.gl/textures@[VERSION]/dist/libs/basis_encoder.js"
// So we get an error when trying to fetch such redirect url without protocol and origin.
const TEXT_URL_WITH_REDIRECT = `https://unpkg.com/@loaders.gl/textures@beta/dist/libs/basis_encoder.js`;
// This type of links on github works via 302 redirect
// ("https://github.com/repository/raw/branch-name/path/to/file/file-name.extension")
const REDIRECT_URL =
  'https://github.com/visgl/deck.gl-data/raw/master/3d-tiles/RoyalExhibitionBuilding/1/1.pnts';
if (!isBrowser) {
  test('polyfills#fetch() (NODE)', async () => {
    if (!isBrowser) {
      const response = await fetch(PLY_CUBE_ATT_URL);
      expect(
        response.headers,
        'fetch polyfill successfully returned headers under Node.js'
      ).toBeTruthy();
      const data = await response.arrayBuffer();
      expect(data, 'fetch polyfill successfully loaded data under Node.js').toBeTruthy();
    }
  });
  test('polyfills#fetch() ignores url query params when loading file (NODE)', async () => {
    if (!isBrowser) {
      const response = await fetch(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
      const data = await response.text();
      expect(
        response.headers,
        'fetch polyfill successfully returned headers under Node.js'
      ).toBeTruthy();
      expect(data, 'fetch polyfill successfully loaded data under Node.js').toBeTruthy();
    }
  });
  test.skip('polyfills#fetch() error handling (NODE)', async () => {
    if (!isBrowser) {
      let response = await fetch('non-existent-file');
      console.log(response.statusText);
      expect(
        response.statusText.includes('ENOENT'),
        'fetch statusText forwards node ENOENT error'
      ).toBeTruthy();
      expect(response.ok, 'fetch polyfill fails cleanly on non-existent file').toBeFalsy();
      expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();
      response = await fetch('.');
      console.log(response.statusText);
      expect(
        response.statusText.includes('EISDIR'),
        'fetch statusText forwards node error'
      ).toBeTruthy();
      expect(response.ok, 'fetch polyfill fails cleanly on directory').toBeFalsy();
      expect(response.arrayBuffer(), 'Response.arrayBuffer() does not throw').toBeTruthy();
    }
  });
  test('polyfills#fetch() able to handle "Accept-Encoding: gzip" (NODE)', async () => {
    if (!isBrowser) {
      // Github will serve the desired compression
      const headers = {
        'Accept-Encoding': 'gzip'
      };
      // Test will pass even if server will refuse to encode into 'gzip' and just return plaintext
      // In case of GitHub URL, it's honoring gzip and properly returning compressed data
      const response = await fetch(PLY_CUBE_ATT_URL, {headers});
      const data = await response.text();
      expect(data.length, 'fetch polyfill data size as expected').toBe(PLY_CUBE_ATT_SIZE);
      expect(
        data,
        'fetch polyfill successfully loaded data under Node.js with "gzip" encoding'
      ).toBeTruthy();
    }
  });
  test('polyfills#fetch() able to handle "Accept-Encoding: br" (NODE)', async () => {
    if (!isBrowser) {
      // Github will serve the desired compression
      const headers = {
        'Accept-Encoding': 'br'
      };
      // Test will pass even if server will refuse to encode into 'br' and just return plaintext
      const response = await fetch(PLY_CUBE_ATT_URL, {headers});
      const data = await response.text();
      expect(
        data.length === PLY_CUBE_ATT_SIZE,
        'fetch polyfill data size as expected'
      ).toBeTruthy();
      expect(
        data,
        'fetch polyfill successfully loaded data under Node.js with "br" encoding'
      ).toBeTruthy();
    }
  });
  test('polyfills#fetch() able to handle "Accept-Encoding: deflate"', async () => {
    if (!isBrowser) {
      // Github will serve the desired compression
      const headers = {
        'Accept-Encoding': 'deflate'
      };
      // Test will pass even if server will refuse to encode into 'deflate' and just return plaintext
      const response = await fetch(PLY_CUBE_ATT_URL, {headers});
      const data = await response.text();
      expect(
        data.length === PLY_CUBE_ATT_SIZE,
        'fetch polyfill data size as expected'
      ).toBeTruthy();
      expect(
        data,
        'fetch polyfill successfully loaded data under Node.js with "deflate" encoding'
      ).toBeTruthy();
    }
  });
  test.skip('polyfills#fetch() able to decompress .gz extension (NODE)', async () => {
    let response = await fetchFile(TEXT_URL);
    expect(response.ok, response.statusText).toBeTruthy();
    let data = await response.text();
    expect(data, 'fetch polyfill correctly read text file').toBe('123456');
    if (!isBrowser) {
      response = await fetchFile(TEXT_URL_GZIPPED);
      expect(response.ok, response.statusText).toBeTruthy();
      data = await response.text();
      expect(data, 'fetch polyfill correctly decompressed gzipped ".gz" file').toBe('123456');
    }
  });
  test('polyfills#fetch() should follow redirect if `followRedirect` option is true', async () => {
    if (!isBrowser) {
      const defaultFetchResponse = await fetch(REDIRECT_URL);
      expect(defaultFetchResponse.status).toBe(200);
      const defaultResponse = await fetchFile(REDIRECT_URL, {});
      expect(defaultResponse.status).toBe(200);
      // @ts-ignore - TODO/ActionEngine
      const successResponse = await fetchFile(REDIRECT_URL, {followRedirect: true});
      expect(successResponse.status).toBe(200);
    }
  });
  // TODO - broke when we upgraded readable-streams-polyfill
  test.skip('polyfills#fetch() should follow redirect if header location doesn`t have protocol and origin', async () => {
    if (!isBrowser) {
      const defaultFetchResponse = await fetch(TEXT_URL_WITH_REDIRECT);
      expect(defaultFetchResponse.status).toBe(200);
    }
  });
}
