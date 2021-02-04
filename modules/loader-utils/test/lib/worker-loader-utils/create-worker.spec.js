/* global Worker, location */
import test from 'tape-catch';
import {WorkerPool} from '@loaders.gl/worker-utils';
import {toArrayBuffer} from '@loaders.gl/loader-utils';
import parseWithWorker from '@loaders.gl/core/lib/loader-utils/parse-with-worker';
import {registerLoaders, _unregisterLoaders} from '@loaders.gl/core/lib/api/register-loaders';

const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;

const hasWorker = typeof Worker !== 'undefined';

const JSONWorkerLoader = {
  id: 'json',
  name: 'TEST-JSON-LOADER',
  extensions: ['json'],
  options: {
    json: {
      workerUrl: './jsonl-loader.worker.js'
    }
  }
};

test.skip('createLoaderWorker', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const callback = message =>
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);

  const workerPool = new WorkerPool({
    source: `url(./json-loader.worker.js)`,
    name: 'test-json-loader',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  const result = await Promise.all(
    TEST_CASES.map(testData =>
      workerPool.process({
        arraybuffer: toArrayBuffer(JSON.stringify(testData)),
        type: 'parse',
        source: 'loaders.gl'
      })
    )
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

test.skip('createLoaderWorker#nested', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  registerLoaders(JSONWorkerLoader);

  const TEST_CASES = [[{chunk: 0}, {chunk: 1}, {chunk: 2}], [{chunk: 3}, {chunk: 4}]];

  const result = await Promise.all(
    TEST_CASES.map(testData =>
      parseWithWorker(
        JSONWorkerLoader,
        toArrayBuffer(testData.map(data => JSON.stringify(data)).join('\n')),
        JSONWorkerLoader.options
      )
    )
  );
  t.deepEquals(result[0], TEST_CASES[0], 'worker returns expected result');
  t.deepEquals(result[1], TEST_CASES[1], 'worker returns expected result');

  _unregisterLoaders();

  t.end();
});

test.skip('parseWithWorker#options.workerUrl', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const testData = [{chunk: 0}, {chunk: 1}, {chunk: 2}];

  let parsedData = await parseWithWorker(
    true,
    'test-json-loader',
    toArrayBuffer(JSON.stringify(testData)),
    {
      json: {
        workerUrl: './json-loader.worker.js'
      }
    }
  );

  t.deepEquals(parsedData, testData, 'data parsed with relative worker url');

  parsedData = await parseWithWorker(
    true,
    'test-json-loader',
    toArrayBuffer(JSON.stringify(testData)),
    {
      json: {
        workerUrl: `${location.origin}/json-loader.worker.js`
      }
    }
  );

  t.deepEquals(parsedData, testData, 'data parsed with absolute worker url');

  t.end();
});
