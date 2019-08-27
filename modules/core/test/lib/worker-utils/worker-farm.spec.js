/* global Worker */
import test from 'tape-catch';
import {_WorkerThread, _WorkerPool} from '@loaders.gl/core';
import testWorker from './test-worker';

const hasWorker = typeof Worker !== 'undefined';

test('WorkerThread', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }
  const testBuffer = new Float32Array(100).buffer;

  const workerThread = new _WorkerThread(testWorker);

  const result = await workerThread.process(testBuffer);

  t.ok(result instanceof ArrayBuffer, 'worker returns expected result');

  workerThread.destroy();

  t.ok(workerThread.worker === null);

  t.end();
});

test('WorkerPool', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const CHUNKS_TOTAL = 6;
  const MAX_CONCURRENCY = 3;

  let processed = 0;

  const callback = message =>
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);

  const workerPool = new _WorkerPool({
    source: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const testData = {chunk: i};
    const result = await workerPool.process(testData);
    processed++;
    t.deepEquals(result, testData, 'worker returns expected result');
    if (processed === CHUNKS_TOTAL) {
      t.end();
    }
  }
});
