import test from 'tape-catch';
import {WorkerPool} from '@loaders.gl/worker-utils';
import {toArrayBuffer} from '@loaders.gl/loader-utils';
import {parseWithWorker} from '@loaders.gl/loader-utils';
import {registerLoaders, _unregisterLoaders} from '@loaders.gl/core/lib/api/register-loaders';
import {NullWorkerLoader} from '@loaders.gl/core';

const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;

const hasWorker = typeof Worker !== 'undefined';

test('parseWithWorker', async (t) => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const testData = [{chunk: 0}, {chunk: 1}, {chunk: 2}];
  let parsedData = await parseWithWorker(NullWorkerLoader, testData, {
    _workerType: 'test'
  });

  t.deepEquals(parsedData, testData, 'data parsed with relative worker url');

  parsedData = await parseWithWorker(NullWorkerLoader, testData, {
    _workerType: 'test'
  });

  t.deepEquals(parsedData, testData, 'data parsed with absolute worker url');

  t.end();
});

test.skip('createLoaderWorker', async (t) => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
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
  if (!hasWorker) {
    t.comment('Worker test is browser only');
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
