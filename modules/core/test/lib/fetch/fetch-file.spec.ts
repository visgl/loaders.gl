import {expect, test} from 'vitest';
import {isBrowser, fetchFile} from '@loaders.gl/core';

const DATA_URL = 'data:,important content!';
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';
const TEXT_URL = '@loaders.gl/core/test/data/files/hello-world.txt';

test('fetchFile#imports', () => {
  expect(fetchFile, 'fetchFile defined').toBeTruthy();
});

test('fetchFile#dataUrl', async () => {
  const response = await fetchFile(DATA_URL);
  const data = await response.text();

  expect(data, 'fetchFile loaded data url').toBe('important content!');
});

test.runIf(!isBrowser)('fetchFile#file (BINARY)', async () => {
  const response = await fetchFile(BINARY_URL);
  const data = await response.arrayBuffer();

  expect(data instanceof ArrayBuffer, 'fetchFile loaded local file into ArrayBuffer').toBeTruthy();
  expect(data.byteLength, 'fetchFile loaded local file length correctly').toBe(4);
});

test.runIf(!isBrowser)('fetchFile#file (TEXT)', async () => {
  const response = await fetchFile(TEXT_URL);
  const data = await response.text();

  expect(typeof data, 'fetchFile loaded local file into string').toBe('string');
  expect(data, 'fetchFile loaded local file data correctly').toBe('Hello world!');
});
