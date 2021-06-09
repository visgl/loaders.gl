import test from 'tape-promise/tape';

import {isBrowser, parse} from '@loaders.gl/core';

const JSON_DATA = [{col1: 22, col2: 'abc'}];

const JSONLoader = {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync: JSON.parse
};

test('parse#Blob (text)', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping parse(Blob) tests in Node.js');
    t.end();
    return;
  }

  const TEXT_DATA = JSON.stringify(JSON_DATA);
  const blob = new Blob([TEXT_DATA]);

  // @ts-ignore (partial loader object)
  const data = await parse(blob, JSONLoader);

  t.deepEquals(data, JSON_DATA, 'parse(Blob) returned data');

  t.end();
});

test('parse#Blob (binary)', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping parse(Blob) tests in Node.js');
    t.end();
    return;
  }

  t.comment('Not implemented...');
  t.end();
});

test('parse#Blob (streaming parser)', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping fetchFile in Node.js');
    t.end();
    return;
  }

  t.comment('Not implemented...');
  t.end();
});
