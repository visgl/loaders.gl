import {expect, test} from 'vitest';
import {WorkerPool} from '@loaders.gl/worker-utils';
import {toArrayBuffer, parseWithWorker} from '@loaders.gl/loader-utils';
import {
  registerLoaders,
  _unregisterLoaders,
  NullWorkerLoader,
  coreApi,
  parse
} from '@loaders.gl/core';
const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;
test('parseWithWorker', async () => {
  if (!WorkerPool.isSupported()) {
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
  const result = await parseWithWorker(NullWorkerLoader, testData, testOptions, testContext);
  expect(result).toBe(null);
});
test.skip('createLoaderWorker', async () => {
  if (!WorkerPool.isSupported()) {
    console.log('Workers not supported, skipping tests');
    return;
  }
  const callback = info =>
    console.log(`Processing with worker ${info.name}, queued jobs ${info.backlog}`);
  const workerPool = new WorkerPool({
    url: 'modules/loader-utils/test/lib/worker-loader-utils/json-worker.js',
    name: 'test-json-loader',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });
  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));
  const result = await Promise.all(
    TEST_CASES.map(async testData => {
      const job = await workerPool.startJob('test');
      job.postMessage('process', {
        input: toArrayBuffer(JSON.stringify(testData))
      });
    })
  );
  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    expect(result[i], 'worker returns expected result').toEqual({
      type: 'done',
      result: TEST_CASES[i]
    });
  }
  workerPool.destroy();
});
test('parseWithWorker#nested', async () => {
  if (!WorkerPool.isSupported()) {
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
    worker: true,
    extensions: [],
    mimeTypes: [],
    tests: [arrayBuffer => arrayBuffer instanceof ArrayBuffer],
    options: {}
  };

  const nestedWorkerSource = `
    let requestId = 0;

    self.onmessage = event => {
      const {type, payload} = event.data;
      if (type !== 'process') {
        return;
      }

      const id = requestId++;

      const onMessage = nestedEvent => {
        const {type: nestedType, payload: nestedPayload} = nestedEvent.data;
        if (nestedPayload.id !== id) {
          return;
        }

        self.removeEventListener('message', onMessage);
        if (nestedType === 'done') {
          self.postMessage({source: 'loaders.gl', type: 'done', payload: {result: nestedPayload.result}});
        } else if (nestedType === 'error') {
          self.postMessage({source: 'loaders.gl', type: 'error', payload: {error: nestedPayload.error}});
        }
      };

      self.addEventListener('message', onMessage);
      self.postMessage({
        source: 'loaders.gl',
        type: 'process',
        payload: {id, input: payload.input, options: {...payload.options, worker: false}}
      });
    };
  `;

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
          {source: nestedWorkerSource, worker: true, reuseWorkers: false},
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
