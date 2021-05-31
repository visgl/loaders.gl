import test from 'tape-promise/tape';
import {isBrowser, load, fetchFile, registerLoaders, resolvePath} from '@loaders.gl/core';
import {JSONLoader} from '@loaders.gl/json';

const JSON_URL = '@loaders.gl/core/test/data/files/basic.json';

const JSON_DATA = [{col1: 22, col2: 'abc'}];

test('load#load', async t => {
  t.ok(load, 'load defined');
  // @ts-ignore TS2554: Expected 2-4 arguments, but got 1.
  await t.rejects(load('.'), 'load throws on undefined loaders');
  t.end();
});

test('load#with fetch options', async t => {
  t.ok(
    await load(JSON_URL, JSONLoader, {headers: {'Content-Type': 'application/json'}}),
    'load with fetch options at the root should trigger warnings'
  );

  t.ok(
    await load(JSON_URL, JSONLoader, {fetch: {headers: {'Content-Type': 'application/json'}}}),
    'load with fetch options work'
  );

  const fetch = url => new Response('{"abc": 1}');
  t.deepEqual(
    await load(JSON_URL, JSONLoader, {fetch}),
    {abc: 1},
    'load with fetch function works'
  );
  t.end();
});

test('load#load', async t => {
  t.ok(load, 'load defined');
  // @ts-ignore TS2554: Expected 2-4 arguments, but got 1.
  await t.rejects(load('.'), 'load throws on undefined loaders');
  t.end();
});

test('load#auto detect loader', t => {
  const TEST_LOADER = {
    name: 'JSON',
    extensions: ['json'],
    parse: async (arrayBuffer, options, context) => {
      t.ok(arrayBuffer instanceof ArrayBuffer, 'Got ArrayBuffer');
      t.deepEquals(options.JSON, {option: true}, 'Option is passed through');
      t.ok(context.parse, 'context is populated');
      t.end();
    }
  };
  // @ts-ignore TS2345: Argument of type not assignable
  registerLoaders(TEST_LOADER);
  // @ts-ignore TODO remove this ts-ignore
  load('package.json', {JSON: {option: true}});
});

test('load#Blob(text) - BROWSER ONLY', async t => {
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

test('load#stream', async t => {
  const response = await fetchFile(JSON_URL);
  const stream = response.body;
  // @ts-ignore
  const data = await load(stream, JSONLoader);
  t.equals(typeof data, 'object', 'load(stream) returned data');
  t.end();
});

test('load#Node stream - NODE ONLY', async t => {
  if (isBrowser) {
    t.comment('Skipping load(Node stream) tests in Node.js');
    t.end();
    return;
  }

  const fs = require('fs');
  const stream = fs.createReadStream(resolvePath(JSON_URL));
  // @ts-ignore TODO remove this ts-ignore
  const data = await load(stream, JSONLoader);
  t.equals(typeof data, 'object', 'load(Node stream) returned data');

  t.end();
});
