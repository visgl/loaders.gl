/* global Worker */
import test from 'tape-catch';
import {_WorkerThread, _WorkerPool} from '@loaders.gl/loader-utils';

const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;

const hasWorker = typeof Worker !== 'undefined';
const testWorkerSource = `
  self.onmessage = event => {
    setTimeout(() => self.postMessage(event.data), 50);
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

  // @ts-ignore Undeclared member
  t.ok(workerThread.worker === null);

  t.end();
});

test('WorkerPool', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const callback = message =>
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);

  const workerPool = new _WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  const result = await Promise.all(TEST_CASES.map(testData => workerPool.process(testData)));

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    t.deepEquals(result[i], TEST_CASES[i], 'worker returns expected result');
  }

  workerPool.destroy();
  t.end();
});

test('WorkerPool with reuseWorkers === false param', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  let workerPool = null;

  workerPool = new _WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    reuseWorkers: false
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  Promise.all(TEST_CASES.map(testData => workerPool.process(testData))).then(() => {
    console.log('workerPool.idleQueue ', workerPool.idleQueue.length); // eslint-disable-line
    t.equal(workerPool.idleQueue.length, 0);
    workerPool.destroy();
    t.end();
  });
});

test('WorkerPool with reuseWorkers === true param', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  let workerPool = null;

  workerPool = new _WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    reuseWorkers: true
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  Promise.all(TEST_CASES.map(testData => workerPool.process(testData))).then(() => {
    console.log('workerPool.idleQueue ', workerPool.idleQueue.length); // eslint-disable-line
    t.equal(workerPool.idleQueue.length, 3);
    workerPool.destroy();
    t.end();
  });
});
