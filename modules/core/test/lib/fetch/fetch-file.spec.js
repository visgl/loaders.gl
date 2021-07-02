import test from 'tape-promise/tape';

import {isBrowser, fetchFile} from '@loaders.gl/core';

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
