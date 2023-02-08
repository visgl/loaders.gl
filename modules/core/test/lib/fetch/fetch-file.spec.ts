import test from 'tape-promise/tape';
import {isBrowser, fetchFile} from '@loaders.gl/core';

const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const PLY_CUBE_ATT_SIZE = 853;
const TEXT_URL_UNZIPPED = `@loaders.gl/polyfills/test/data/data.txt`;
const TEXT_URL_GZIPPED = `@loaders.gl/polyfills/test/data/data.txt.gz`;
// Request of this url returns location like "/@loaders.gl/textures@[VERSION]/dist/libs/basis_encoder.js"
// So we get an error when trying to fetch such redirect url without protocol and origin.
const TEXT_URL_WITH_REDIRECT = `https://unpkg.com/@loaders.gl/textures@beta/dist/libs/basis_encoder.js`;

// This type of links on github works via 302 redirect
// ("https://github.com/repository/raw/branch-name/path/to/file/file-name.extension")
const REDIRECT_URL =
  'https://github.com/visgl/deck.gl-data/raw/master/3d-tiles/RoyalExhibitionBuilding/1/1.pnts';


const DATA_URL = 'data:,important content!';
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';
const TEXT_URL = '@loaders.gl/core/test/data/files/hello-world.txt';

test('fetchFile#imports', (t) => {
  t.ok(fetchFile, 'fetchFile defined');
  t.end();
});

test('fetchFile#dataUrl', async (t) => {
  const response = await fetchFile(DATA_URL);
  const data = await response.text();
  t.equals(data, 'important content!', 'fetchFile loaded data url');
  t.end();
});

test('fetchFile#file (BINARY)', async (t) => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const response = await fetchFile(BINARY_URL);
  const data = await response.arrayBuffer();
  t.ok(data instanceof ArrayBuffer, 'fetchFile loaded local file into ArrayBuffer');
  t.equals(data.byteLength, 4, 'fetchFile loaded local file length correctly');
  t.end();
});

test('fetchFile#file (TEXT)', async (t) => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const response = await fetchFile(TEXT_URL);
  const data = await response.text();
  t.equals(typeof data, 'string', 'fetchFile loaded local file into string');
  t.equals(data, 'Hello world!', 'fetchFile loaded local file data correctly');
  t.end();
});


// This is a test for fetchFile, not fetch
test.skip('fetchFile() error handling (NODE)', async (t) => {
  if (!isBrowser) {
    let response;
    try {
      response = await fetchFile('non-existent-file');
      t.ok(
        response.statusText.includes('ENOENT'),
        `fetch statusText forwards node ENOENT error: ${response.statusText}`
      );
      t.notOk(response.ok, 'fetch polyfill fails cleanly on non-existent file');
      t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');

      response = await fetchFile('.');
      t.ok(
        response.statusText.includes('EISDIR'),
        `fetch statusText forwards node error: ${response.statusText}`
      );
      t.notOk(response.ok, 'fetch polyfill fails cleanly on directory');
      t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');
    } catch (error) {
      t.pass(`fetch nonexistent threw ${error instanceof Error && error.message || ''}`);
    }
  }
  t.end();
});

test('fetchFile() able to handle "Accept-Encoding: gzip" (NODE)', async (t) => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'gzip'
    };
    // Test will pass even if server will refuse to encode into 'gzip' and just return plaintext
    // In case of GitHub URL, it's honoring gzip and properly returning compressed data
    const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.equal(data.length, PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "gzip" encoding');
  }
  t.end();
});

test('fetchFile() able to handle "Accept-Encoding: br" (NODE)', async (t) => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'br'
    };
    // Test will pass even if server will refuse to encode into 'br' and just return plaintext
    const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "br" encoding');
  }
  t.end();
});

test('fetchFile() able to handle "Accept-Encoding: deflate"', async (t) => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'deflate'
    };
    // Test will pass even if server will refuse to encode into 'deflate' and just return plaintext
    const response = await fetchFile(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "deflate" encoding');
  }
  t.end();
});

test('fetchFile() able to decompress .gz extension (NODE)', async (t) => {
  let response = await fetchFile(TEXT_URL_UNZIPPED);
  t.ok(response.ok, response.statusText);
  let data = await response.text();
  t.equal(data, '123456', 'fetch polyfill correctly read text file');

  if (!isBrowser) {
    response = await fetchFile(TEXT_URL_GZIPPED);
    t.ok(response.ok, response.statusText);
    data = await response.text();
    t.equal(data, '123456', 'fetch polyfill correctly decompressed gzipped ".gz" file');
  }
  t.end();
});

test('fetchFile() should follow redirect if `followRedirect` option is true', async (t) => {
  if (!isBrowser) {
    const defaultFetchResponse = await fetchFile(REDIRECT_URL);
    t.equal(defaultFetchResponse.status, 200);

    const defaultResponse = await fetchFile(REDIRECT_URL, {});
    t.equal(defaultResponse.status, 200);

    // @ts-ignore - TODO/ActionEngine
    const successResponse = await fetchFile(REDIRECT_URL, {followRedirect: true});
    t.equal(successResponse.status, 200);

    // TODO/ActionEngine - restore
    // const failedResponse = await fetchFile(REDIRECT_URL, {followRedirect: false});
    // t.equal(failedResponse.status, 302);
  }
  t.end();
});

test('fetchFile() should follow redirect if header location doesn`t have protocol and origin', async (t) => {
  if (!isBrowser) {
    const defaultFetchResponse = await fetchFile(TEXT_URL_WITH_REDIRECT);
    t.equal(defaultFetchResponse.status, 200);
  }
  t.end();
});
