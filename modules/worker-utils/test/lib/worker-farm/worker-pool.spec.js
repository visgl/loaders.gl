import test from 'tape-catch';
import {WorkerPool} from '@loaders.gl/worker-utils';

const CHUNKS_TOTAL = 6;
const MAX_CONCURRENCY = 3;

const hasWorker = typeof Worker !== 'undefined';
const testWorkerSource = `
  self.onmessage = function(event) {
    const messageData = {
      source: 'loaders.gl',
      type: 'done',
      payload: {output: event.data.payload.input}
    };
    setTimeout(function () { self.postMessage(messageData); }, 50);
  };
`;

test('WorkerPool', async (t) => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const callback = (info) => {
    t.comment(`${info.message} ${info.jobName}, queued jobs ${info.backlog}`);
  };

  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  const result = await Promise.all(
    TEST_CASES.map(async (data) => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data.chunk});
      return job.result;
    })
  );

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    t.deepEquals(result[i].output, TEST_CASES[i].chunk, 'worker returns expected result');
  }

  workerPool.destroy();
  t.end();
});

test('WorkerPool with reuseWorkers === false param', async (t) => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    reuseWorkers: false
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  await Promise.all(
    TEST_CASES.map(async (data) => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data});
      return job.result;
    })
  );

  // @ts-ignore
  t.equal(workerPool.idleQueue.length, 0);
  workerPool.destroy();
  t.end();
});

test('WorkerPool with reuseWorkers === true param', async (t) => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    reuseWorkers: true
  });

  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));

  await Promise.all(
    TEST_CASES.map(async (data) => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data});
      return job.result;
    })
  );

  // @ts-ignore
  t.equal(workerPool.idleQueue.length, 3);
  workerPool.destroy();
  t.end();
});
