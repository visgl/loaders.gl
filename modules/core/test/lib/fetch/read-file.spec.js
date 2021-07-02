import test from 'tape-promise/tape';

import {isBrowser, fetchFile, readFileSync} from '@loaders.gl/core';

const DATA_URL = 'data:,important content!';
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';
const TEXT_URL = '@loaders.gl/core/test/data/files/hello-world.txt';

test('readFile#imports', (t) => {
  t.ok(readFileSync, 'readFileSync defined');
  t.end();
});

// Only support this if we can also support sync data URL decoding in browser
test.skip('readFileSync#dataUrl', (t) => {
  if (isBrowser) {
    t.comment('Skip readFileSync in browser');
    t.end();
    return;
  }

  const data = readFileSync(DATA_URL);
  t.ok(data, 'readFileSync loaded data url');
  t.end();
});

test('readFileSync#file (BINARY)', (t) => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const data = readFileSync(BINARY_URL);
  t.ok(data instanceof ArrayBuffer, 'readFileSync loaded local file into ArrayBuffer');
  t.equals(data.byteLength, 4, 'readFileSync loaded local file length correctly');
  t.end();
});

test('readFileSync#file (TEXT)', (t) => {
  if (isBrowser) {
    t.comment('Skip readFileSync in browser');
    t.end();
    return;
  }

  const data = readFileSync(TEXT_URL, {encoding: 'utf8'});
  t.equals(typeof data, 'string', 'fetchFile loaded local file into string');
  t.equals(data, 'Hello world!', 'fetchFile loaded local file data correctly');
  t.end();
});
