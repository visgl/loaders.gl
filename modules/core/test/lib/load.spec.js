/* global Blob */
import {isBrowser, load, registerLoaders} from '@loaders.gl/core';

import test from 'tape-promise/tape';

const JSON_DATA = [{col1: 22, col2: 'abc'}];

const JSONLoader = {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync: JSON.parse
};

test('load#load', async t => {
  t.ok(load, 'load defined');
  await t.rejects(load('.'), 'load throws on undefined loaders');
  t.end();
});

test('load#auto detect loader', t => {
  registerLoaders({
    name: 'JSON',
    extensions: ['json'],
    parse: data => {
      t.ok(data instanceof ArrayBuffer, 'Got ArrayBuffer');
      t.end();
    }
  });
  load('package.json');
});

test('load#Blob (text)', async t => {
  if (!isBrowser) {
    t.comment('Skipping load(Blob) tests in Node.js');
    t.end();
    return;
  }

  const TEXT_DATA = JSON.stringify(JSON_DATA);
  const blob = new Blob([TEXT_DATA]);

  const data = await load(blob, JSONLoader);

  t.deepEquals(data, JSON_DATA, 'load(Blob) returned data');

  t.end();
});
