import {expect, test} from 'vitest';
import {WorkerPool} from '@loaders.gl/worker-utils';
import {toArrayBuffer, parseWithWorker} from '@loaders.gl/loader-utils';
import {registerLoaders, _unregisterLoaders, NullWorkerLoader, coreApi} from '@loaders.gl/core';
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
test.skip('createLoaderWorker#nested', async () => {
  if (!WorkerPool.isSupported()) {
    console.log('Workers not supported, skipping tests');
    return;
  }
  registerLoaders([NullWorkerLoader]);
  const TEST_CASES = [
    [{chunk: 0}, {chunk: 1}, {chunk: 2}],
    [{chunk: 3}, {chunk: 4}]
  ];
  const result = await Promise.all(
    TEST_CASES.map(testData =>
      parseWithWorker(
        NullWorkerLoader,
        toArrayBuffer(testData.map(data => JSON.stringify(data)).join('\n')),
        NullWorkerLoader.options
      )
    )
  );
  expect(result[0], 'worker returns expected result').toEqual(TEST_CASES[0]);
  expect(result[1], 'worker returns expected result').toEqual(TEST_CASES[1]);
  _unregisterLoaders();
});
