import {expect, test} from 'vitest';
import {parseFromContext} from '@loaders.gl/loader-utils';
import {
  isBrowser,
  load,
  fetchFile,
  registerLoaders,
  resolvePath,
  NullLoader,
  NullWorkerLoader
} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {JSONLoader} from '@loaders.gl/json';

const JSON_URL = '@loaders.gl/core/test/data/files/basic.json';
const JSON_DATA = [{col1: 22, col2: 'abc'}];

test('load#load', async () => {
  expect(load, 'load defined').toBeTruthy();
  // @ts-ignore TS2554: Expected 2-4 arguments, but got 1.
  await expect(load('.'), 'load throws on undefined loaders').rejects.toBeDefined();
});

test('load#with fetch options', async () => {
  expect(
    await load(JSON_URL, JSONLoader, {fetch: {headers: {'Content-Type': 'application/json'}}}),
    'load with fetch options work'
  ).toBeTruthy();

  const fetch = _url => new Response('{"abc": 1}');

  expect(
    // @ts-expect-error
    await load(JSON_URL, JSONLoader, {fetch}),
    'load with fetch function works'
  ).toEqual({abc: 1});
});

test('load#auto detect loader', () => {
  const testLoader = {
    name: 'JSON',
    extensions: ['json'],
    parse: async (arrayBuffer, options, context) => {
      expect(arrayBuffer instanceof ArrayBuffer, 'Got ArrayBuffer').toBeTruthy();
      expect(options.JSON, 'Option is passed through').toEqual({option: true});
      expect(context._parse, 'context is populated').toBeTruthy();
    }
  };

  // @ts-ignore TS2345: Argument of type not assignable
  registerLoaders(testLoader);
  // @ts-ignore TODO remove this ts-ignore
  load(isBrowser ? '/package.json' : 'package.json', {JSON: {option: true}});
});

function checkResponse(response) {
  expect(response, 'response is populated').toBeTruthy();
  expect(response.url.indexOf(resolvePath(JSON_URL)) !== -1, 'response URL is set').toBeTruthy();
  expect(response.status, 'response status is 200').toBe(200);
  expect(response.headers['content-length'], 'response content-length is correct').toBe('4590');
}

test('load#load retrieve Response', async () => {
  const testLoader = {
    name: 'JSON',
    extensions: ['json'],
    parse: async (arrayBuffer, options, context) => {
      expect(arrayBuffer instanceof ArrayBuffer, 'Got ArrayBuffer').toBeTruthy();
      const data = await parseFromContext(arrayBuffer, JSONLoader, {}, context);
      expect(data, 'Read response data').toBeTruthy();

      const {response} = context;
      checkResponse(response);
      return response;
    }
  };

  const response = await load(JSON_URL, testLoader);
  checkResponse(response);
});

test.runIf(isBrowser)('load#load retrieve Response from worker - BROWSER ONLY', async () => {
  const result = await load(JSON_URL, NullWorkerLoader, {
    _workerType: 'test',
    reuseWorkers: false
  });
  expect(result, 'null passed through by NullWorkerLoader').toBe(null);
});

test.runIf(isBrowser)('load#Blob(text) - BROWSER ONLY', async () => {
  const textData = JSON.stringify(JSON_DATA);
  const blob = new Blob([textData]);
  const data = await load(blob, JSONLoader);

  expect(data, 'load(Blob) returned data').toEqual(JSON_DATA);
});

test('load#stream', async () => {
  const response = await fetchFile(JSON_URL);
  const stream = response.body;
  // @ts-ignore
  const data = await load(stream, JSONLoader);

  expect(typeof data, 'load(stream) returned data').toBe('object');
});

test('load#ignores core.shape for loaders without shape support', async () => {
  const data = await load(JSON_URL, NullLoader, {core: {shape: 'object-row-table'}});
  expect(data).toBe(null);
});

function _typeTestsForCoreShape() {
  load(JSON_URL, JSONLoader, {core: {shape: 'array-row-table'}});
  load(JSON_URL, JSONLoader, {core: {shape: 'object-row-table'}});
  // @ts-expect-error JSONLoader core.shape should be limited to JSON row shapes
  load(JSON_URL, JSONLoader, {core: {shape: 'columnar-table'}});

  load(JSON_URL, [JSONLoader, ArrowLoader], {core: {shape: 'columnar-table'}});
  load(JSON_URL, [JSONLoader, ArrowLoader], {core: {shape: 'array-row-table'}});
  // @ts-expect-error JSONLoader + ArrowLoader core.shape should reject unsupported shapes
  load(JSON_URL, [JSONLoader, ArrowLoader], {core: {shape: 'binary'}});
}

void _typeTestsForCoreShape;
