import test from 'tape-promise/tape';
import {WorkerPool} from '@loaders.gl/worker-utils';
import {toArrayBuffer, parseWithWorker} from '@loaders.gl/loader-utils';
import {registerLoaders, _unregisterLoaders} from '@loaders.gl/core';
import {NullWorkerLoader} from '@loaders.gl/core';

const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;

test('parseWithWorker', async (t) => {
  if (!WorkerPool.isSupported()) {
    t.comment('Workers not supported, skipping tests');
    t.end();
    return;
  }

  const testResponse = new Response();
  const testData = [{chunk: 0}, {chunk: 1}, {chunk: 2}];
  const testOptions = {_workerType: 'test', reuseWorkers: false, custom: 'custom'};
  const testContext = {response: testResponse, fetch, parse: async (arrayBuffer) => arrayBuffer};
  const {arrayBuffer, options, context} = await parseWithWorker(
    NullWorkerLoader,
    testData,
    testOptions,
    testContext
  );

  t.deepEquals(arrayBuffer, testData, 'data parsed with relative worker url');
  t.equals(options.custom, 'custom', 'options parsed with relative worker url');
  t.ok(context, 'context parsed with relative worker url');
  t.ok(context.response, 'context response parsed with relative worker url');

  t.end();
});

test.skip('createLoaderWorker', async (t) => {
  if (!WorkerPool.isSupported()) {
    t.comment('Workers not supported, skipping tests');
    t.end();
    return;
  }

  const callback = (info) =>
    t.comment(`Processing with worker ${info.name}, queued jobs ${info.backlog}`);

  const workerPool = new WorkerPool({
    url: 'modules/loader-utils/test/lib/worker-loader-utils/json-worker.js',
    name: 'test-json-loader',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  const result = await Promise.all(
    TEST_CASES.map(async (testData) => {
      const job = await workerPool.startJob('test');
      job.postMessage('process', {
        input: toArrayBuffer(JSON.stringify(testData))
      });
    })
  );

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    t.deepEquals(
      result[i],
      {type: 'done', result: TEST_CASES[i]},
      'worker returns expected result'
    );
  }

  workerPool.destroy();
  t.end();
});

test.skip('createLoaderWorker#nested', async (t) => {
  if (!WorkerPool.isSupported()) {
    t.comment('Workers not supported, skipping tests');
    t.end();
    return;
  }

  registerLoaders([NullWorkerLoader]);

  const TEST_CASES = [
    [{chunk: 0}, {chunk: 1}, {chunk: 2}],
    [{chunk: 3}, {chunk: 4}]
  ];

  const result = await Promise.all(
    TEST_CASES.map((testData) =>
      parseWithWorker(
        NullWorkerLoader,
        toArrayBuffer(testData.map((data) => JSON.stringify(data)).join('\n')),
        NullWorkerLoader.options
      )
    )
  );
  t.deepEquals(result[0], TEST_CASES[0], 'worker returns expected result');
  t.deepEquals(result[1], TEST_CASES[1], 'worker returns expected result');

  _unregisterLoaders();

  t.end();
});
