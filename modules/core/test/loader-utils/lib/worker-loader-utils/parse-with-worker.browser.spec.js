// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {toArrayBuffer, parseWithWorker} from '@loaders.gl/core/loader-utils';
import {registerLoaders, _unregisterLoaders, NullLoader, coreApi, parse} from '@loaders.gl/core';
test('parseWithWorker', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Workers not supported, skipping tests');
    return;
  }
  const testResponse = new Response();
  const testData = [{chunk: 0}, {chunk: 1}, {chunk: 2}];
  const testOptions = {
    _workerType: 'test',
    reuseWorkers: false,
    custom: 'custom'
  };
  const testContext = {
    response: testResponse,
    fetch,
    coreApi,
    _parse: async arrayBuffer => arrayBuffer
  };
  const result = await parseWithWorker(NullLoader, testData, testOptions, testContext);
  expect(result).toBe(null);
});
test('parseWithWorker#nested', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Workers not supported, skipping tests');
    return;
  }

  const NestedJSONLoader = {
    id: 'nested-json',
    name: 'Nested JSON',
    module: 'loader-utils',
    version: 'latest',
    extensions: [],
    mimeTypes: [],
    tests: [arrayBuffer => arrayBuffer instanceof ArrayBuffer],
    parse: async arrayBuffer =>
      new TextDecoder()
        .decode(arrayBuffer)
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line)),
    options: {}
  };

  const NestedJSONWorkerLoader = {
    id: 'nested-json-worker',
    name: 'Nested JSON worker',
    module: 'loader-utils',
    version: 'latest',
    worker: new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href,
    extensions: [],
    mimeTypes: [],
    tests: [arrayBuffer => arrayBuffer instanceof ArrayBuffer],
    options: {}
  };

  registerLoaders([NestedJSONLoader]);
  const TEST_CASES = [
    [{chunk: 0}, {chunk: 1}, {chunk: 2}],
    [{chunk: 3}, {chunk: 4}]
  ];
  try {
    const result = await Promise.all(
      TEST_CASES.map(testData =>
        parseWithWorker(
          NestedJSONWorkerLoader,
          toArrayBuffer(testData.map(data => JSON.stringify(data)).join('\n')),
          {callback: true, worker: true},
          {fetch, coreApi, _parse: async arrayBuffer => arrayBuffer},
          parse
        )
      )
    );
    expect(result[0], 'worker returns expected result').toEqual(TEST_CASES[0]);
    expect(result[1], 'worker returns expected result').toEqual(TEST_CASES[1]);
  } finally {
    _unregisterLoaders();
  }
});

test('parseWithWorker#nested preserves legacy parseOnMainThread options argument', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Workers not supported, skipping tests');
    return;
  }

  const NestedWorkerLoader = {
    id: 'nested-legacy-options-worker',
    name: 'Nested Legacy Options Worker',
    module: 'loader-utils',
    version: 'latest',
    worker: new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href,
    extensions: [],
    mimeTypes: [],
    tests: [arrayBuffer => arrayBuffer instanceof ArrayBuffer],
    options: {}
  };

  const result = await parseWithWorker(
    NestedWorkerLoader,
    toArrayBuffer('abc'),
    {callback: true, worker: true, custom: 'custom-option'},
    {fetch, coreApi, _parse: async arrayBuffer => arrayBuffer},
    async (_arrayBuffer, options) => options
  );

  expect(result.custom).toBe('custom-option');
  expect(result.worker).toBe(false);
});

test('worker options retain Headers instances in namespaced and legacy fetch options', async () => {
  const loader = {
    id: 'request-headers',
    name: 'Request headers',
    module: 'core',
    version: '1',
    extensions: [],
    mimeTypes: [],
    worker: new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href
  };
  const result = await parseWithWorker(loader, new ArrayBuffer(0), {
    echoFetch: true,
    core: {
      worker: true,
      echoFetch: true,
      fetch: {headers: new Headers({Authorization: 'Bearer test', 'X-Sidecar': 'dbf'})}
    },
    fetch: {headers: new Headers({'X-Legacy': 'retained'})}
  });
  expect(JSON.parse(new TextDecoder().decode(result))).toEqual({
    core: {headers: {authorization: 'Bearer test', 'x-sidecar': 'dbf'}},
    legacy: {headers: {'x-legacy': 'retained'}}
  });
});
