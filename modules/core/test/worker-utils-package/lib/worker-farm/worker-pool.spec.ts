import {expect, test, vi} from 'vitest';
import {WorkerPool} from '@loaders.gl/core/worker-utils';
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

test('WorkerPool destroy rejects queued jobs with its reason', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
    return;
  }
  const workerPool = new WorkerPool({
    source: testWorkerSource,
    name: 'test-worker',
    maxConcurrency: 1
  });
  const activeJob = await workerPool.startJob('active-job');
  activeJob.postMessage('process', {input: 'active'});
  const queuedJobPromise = workerPool.startJob('queued-job');
  const reason = new Error('worker source invalidated');
  workerPool.destroy(reason);

  await expect(queuedJobPromise).rejects.toBe(reason);
  await expect(activeJob.result).rejects.toBe(reason);
});

test('queued cancellation settles before an active job and removes its listener', async () => {
  const pool = new WorkerPool({source: testWorkerSource, maxConcurrency: 1});
  try {
    const active = await pool.startJob('active');
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const queued = pool.startJob('queued', undefined, undefined, controller.signal);
    const reason = new Error('queued cancellation');
    controller.abort(reason);
    await expect(queued).rejects.toBe(reason);
    expect(active.isRunning).toBe(true);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    active.done('finished');
    const next = await pool.startJob('next');
    expect(next.workerThread).toBe(active.workerThread);
    next.done('finished');
  } finally {
    pool.destroy();
  }
});

test('running cancellation replaces only its worker and completion wins a later abort', async () => {
  const pool = new WorkerPool({source: testWorkerSource, maxConcurrency: 2});
  try {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const active = await pool.startJob('cancel', undefined, undefined, controller.signal);
    const other = await pool.startJob('other');
    controller.abort(null);
    await expect(active.result).rejects.toBe(null);
    expect(active.workerThread.terminated).toBe(true);
    expect(other.isRunning).toBe(true);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    const completedController = new AbortController();
    const next = await pool.startJob(
      'replacement',
      undefined,
      undefined,
      completedController.signal
    );
    expect(next.workerThread).not.toBe(active.workerThread);
    next.done('complete');
    completedController.abort();
    await expect(next.result).resolves.toBe('complete');
    expect(next.workerThread.terminated).toBe(false);
    other.done('complete');
  } finally {
    pool.destroy();
  }
});

test('an already aborted job does not create a worker', async () => {
  const loadWorker = vi.fn();
  const pool = new WorkerPool({loadWorker});
  const controller = new AbortController();
  controller.abort('cancelled');
  await expect(pool.startJob('cancelled', undefined, undefined, controller.signal)).rejects.toBe(
    'cancelled'
  );
  expect(loadWorker).not.toHaveBeenCalled();
  pool.destroy();
});

test('explicit undefined job abort reasons are preserved', async () => {
  const pool = new WorkerPool({source: testWorkerSource});
  try {
    const job = await pool.startJob('undefined reason');
    job.abort(undefined);
    await expect(job.result).rejects.toBeUndefined();
    expect(job.workerThread.terminated).toBe(true);
  } finally {
    pool.destroy();
  }
});
