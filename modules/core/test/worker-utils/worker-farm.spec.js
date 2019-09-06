/* global Worker */
import test from 'tape-catch';
import {_WorkerThread, _WorkerPool, toArrayBuffer} from '@loaders.gl/core';

const hasWorker = typeof Worker !== 'undefined';
const testWorkerSource = `
  self.onmessage = event => {
    const {port} = event.data;
    port.onmessage = e => {
      setTimeout(() => port.postMessage(e.data), 50);
    }
  };
`;

test('WorkerThread', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }
  const testBuffer = new Float32Array(100).buffer;

  const workerThread = new _WorkerThread({source: testWorkerSource});

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
    source: testWorkerSource,
    name: 'test-worker',
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

test('createWorker', async t => {
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
    source: `url(./json-loader.worker.js)`,
    name: 'test-json-loader',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const testData = {chunk: i};
    const result = await workerPool.process({
      arraybuffer: toArrayBuffer(JSON.stringify(testData)),
      source: 'loaders.gl'
    });
    processed++;
    t.deepEquals(result, {type: 'done', result: testData}, 'worker returns expected result');
    if (processed === CHUNKS_TOTAL) {
      t.end();
    }
  }
});
