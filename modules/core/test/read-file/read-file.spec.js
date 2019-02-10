import {isBrowser, readFile, readFileSync} from '@loaders.gl/core';

import test from 'tape-promise/tape';

const DATA_URL = 'data:,important content!';
const BINARY_URL = `${__dirname}/../../data/files/binary-data.bin`;
const TEXT_URL = `${__dirname}/../../data/files/hello-world.txt`;

test('readFile#imports', t => {
  t.ok(readFile, 'readFile defined');
  t.ok(readFileSync, 'readFileSync defined');
  t.end();
});

test('readFile#dataUrl', t => {
  readFile(DATA_URL).then(data => {
    t.ok(data, 'readFileSync loaded data url');
    // t.equals(data, 'important content!', 'readFile loaded data url');
    t.end();
  }).catch(_ => t.end());
});

test('readFileSync#dataUrl', t => {
  const data = readFileSync(DATA_URL);
  t.ok(data, 'readFileSync loaded data url');
  t.end();
});

test('readFileSync#file (BINARY)', t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const data = readFileSync(BINARY_URL);
  t.ok(data instanceof ArrayBuffer, 'readFile loaded local file into ArrayBuffer');
  t.equals(data.byteLength, 4, 'readFile loaded local file length correctly');
  t.end();
});

test('readFile#file (BINARY)', t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return null;
  }

  return readFile(BINARY_URL).then(data => {
    t.ok(data instanceof ArrayBuffer, 'readFile loaded local file into ArrayBuffer');
    t.equals(data.byteLength, 4, 'readFile loaded local file length correctly');
    t.end();
  }).catch(error => {
    t.fail(error);
    t.end();
  });
});

test('readFileSync#file (TEXT)', t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const data = readFileSync(TEXT_URL, {dataType: 'text'});
  t.equals(typeof data, 'string', 'readFile loaded local file into string');
  t.equals(data, 'Hello world!', 'readFile loaded local file data correctly');
  t.end();
});

test('readFile#file (TEXT)', t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return null;
  }

  return readFile(TEXT_URL, {dataType: 'text'}).then(data => {
    t.equals(typeof data, 'string', 'readFile loaded local file into string');
    t.equals(data, 'Hello world!', 'readFile loaded local file data correctly');
    t.end();
  }).catch(error => {
    t.fail(error);
    t.end();
  });
});
