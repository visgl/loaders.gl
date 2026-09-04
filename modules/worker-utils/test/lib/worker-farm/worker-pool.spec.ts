import {expect, test} from 'vitest';
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
test('WorkerPool', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
    return;
  }
  const callback = info => {
    console.log(`${info.message} ${info.jobName}, queued jobs ${info.backlog}`);
  };
  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: MAX_CONCURRENCY,
    onDebug: callback
  });
  const TEST_CASES = new Array(CHUNKS_TOTAL).fill(0).map((_, i) => ({chunk: i}));
  const result = await Promise.all(
    TEST_CASES.map(async data => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data.chunk});
      return job.result;
    })
  );
  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    expect(result[i].output, 'worker returns expected result').toEqual(TEST_CASES[i].chunk);
  }
  workerPool.destroy();
});
test('WorkerPool with reuseWorkers === false param', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
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
    TEST_CASES.map(async data => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data});
      return job.result;
    })
  );
  // @ts-ignore
  expect(workerPool.idleQueue.length).toBe(0);
  workerPool.destroy();
});
test('WorkerPool with reuseWorkers === true param', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
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
    TEST_CASES.map(async data => {
      const job = await workerPool.startJob('test-job');
      job.postMessage('process', {input: data});
      return job.result;
    })
  );
  // @ts-ignore
  expect(workerPool.idleQueue.length).toBe(3);
  workerPool.destroy();
});

test('WorkerPool destroy aborts active jobs with its reason', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
    return;
  }
  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: 1
  });
  const job = await workerPool.startJob('test-job');
  job.postMessage('process', {input: 'pending'});
  const reason = new Error('worker source invalidated');
  workerPool.destroy(reason);

  await expect(job.result).rejects.toBe(reason);
});
