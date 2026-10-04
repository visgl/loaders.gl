// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import type {WorkerMessagePayload, WorkerMessageType, WorkerObject} from '../../../src/types';
import WorkerFarm from '../../../src/lib/worker-farm/worker-farm';
import WorkerJob from '../../../src/lib/worker-farm/worker-job';
import type WorkerThread from '../../../src/lib/worker-farm/worker-thread';
import {
  preloadWorker,
  processOnWorker,
  processOnWorkerInBatches
} from '../../../src/lib/worker-api/process-on-worker';

const worker: WorkerObject = {
  id: 'protocol-boundary',
  name: 'Protocol boundary',
  module: 'worker-utils',
  version: 'latest',
  worker: true,
  options: {}
};

/** Leases a real job over an in-memory message sink, without creating a worker. */
function createJobHarness(
  handlePostMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => void = () => {}
) {
  const destroy = vi.fn();
  const postMessage = vi.fn(message => handlePostMessage(message.type, message.payload));
  const job = new WorkerJob('boundary job', {destroy, postMessage} as unknown as WorkerThread);
  let onMessage: (
    job: WorkerJob,
    type: WorkerMessageType,
    payload: WorkerMessagePayload
  ) => unknown = () => {};
  const startJob = vi.fn(async (_name: string, listener: typeof onMessage) => {
    onMessage = listener;
    return job;
  });
  const getWorkerPool = vi.fn(() => ({startJob}));
  vi.spyOn(WorkerFarm, 'getWorkerFarm').mockReturnValue({
    getWorkerPool
  } as unknown as WorkerFarm);
  return {
    job,
    destroy,
    postMessage,
    startJob,
    getWorkerPool,
    /** Delivers a worker protocol message through the registered job handler. */
    emit: (type: WorkerMessageType, payload: WorkerMessagePayload = {}) =>
      onMessage(job, type, payload)
  };
}

afterEach(() => vi.restoreAllMocks());

describe('worker job settlement', () => {
  test('abort supplies an AbortError and settlement is idempotent', async () => {
    const harness = createJobHarness();
    const rejected = expect(harness.job.result).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Worker job "boundary job" was aborted'
    });
    harness.job.abort();
    harness.job.abort(new Error('late abort'));
    harness.job.done('late result');
    harness.job.error(new Error('late error'));
    await rejected;
    expect(harness.destroy).toHaveBeenCalledTimes(1);
    expect(harness.job.isRunning).toBe(false);
  });

  test('completed jobs ignore later errors and aborts', async () => {
    const harness = createJobHarness();
    harness.job.done('first');
    harness.job.done('second');
    harness.job.error(new Error('late error'));
    harness.job.abort();
    await expect(harness.job.result).resolves.toBe('first');
    expect(harness.destroy).not.toHaveBeenCalled();
  });
});

describe('single worker protocol', () => {
  test.each([
    undefined,
    new Error('main thread failed'),
    'non-error rejection'
  ])('answers delegated processing failures: %s', async failure => {
    const harness = createJobHarness();
    const context =
      failure === undefined
        ? {}
        : {
            process: vi.fn(() => {
              throw failure;
            })
          };
    const result = processOnWorker(worker, 'input', {source: 'in-memory'}, context);
    await Promise.resolve();
    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    await harness.emit('process', {id: 7, input: 'nested'});
    expect(harness.postMessage).toHaveBeenLastCalledWith({
      source: 'loaders.gl',
      type: 'error',
      payload: {
        id: 7,
        error:
          failure === undefined
            ? 'Worker not set up to process on main thread'
            : failure instanceof Error
              ? failure.message
              : 'unknown error'
      }
    });
    harness.emit('done', {result: 'finished'});
    await expect(result).resolves.toBe('finished');
  });

  test('strips the abort signal, forwards context, and removes the listener', async () => {
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const harness = createJobHarness();
    const process = vi.fn(async () => 'delegated');
    const result = processOnWorker(
      worker,
      1,
      {signal: controller.signal, source: 'in-memory', jobName: 'named'},
      {process},
      {token: 'context'}
    );
    await Promise.resolve();
    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    expect(harness.postMessage.mock.calls[0][0].payload).toEqual({
      input: 1,
      options: {source: 'in-memory', jobName: 'named'},
      context: {token: 'context'}
    });
    await harness.emit('process', {id: 2, input: 'nested', options: {flag: true}});
    expect(process).toHaveBeenCalledWith('nested', {flag: true}, undefined, {});
    expect(harness.postMessage).toHaveBeenLastCalledWith({
      source: 'loaders.gl',
      type: 'done',
      payload: {id: 2, result: 'delegated'}
    });
    harness.emit('done', {result: 'finished'});
    await expect(result).resolves.toBe('finished');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  test('cancellation while leasing a job prevents input dispatch', async () => {
    const controller = new AbortController();
    const reason = new Error('cancel lease');
    const harness = createJobHarness();
    harness.startJob.mockImplementationOnce(async () => {
      controller.abort(reason);
      return harness.job;
    });
    await expect(
      processOnWorker(worker, 1, {source: 'in-memory', signal: controller.signal})
    ).rejects.toBe(reason);
    expect(harness.postMessage).not.toHaveBeenCalled();
    expect(harness.destroy).toHaveBeenCalledTimes(1);
  });

  test('already aborted signals reject without leasing a worker', async () => {
    const harness = createJobHarness();
    const controller = new AbortController();
    controller.abort(null);
    await expect(processOnWorker(worker, 1, {signal: controller.signal})).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Worker job was aborted'
    });
    expect(harness.startJob).not.toHaveBeenCalled();
  });
});

describe('batch worker failure and cleanup', () => {
  test.each(['error', 'preload'] as const)('rejects %s messages and closes input', async type => {
    const harness = createJobHarness();
    const returnInput = vi.fn(async () => ({done: true as const, value: undefined}));
    const input = {
      [Symbol.asyncIterator]: () => ({next: vi.fn(), return: returnInput})
    };
    const iterator = processOnWorkerInBatches(worker, input, {source: 'in-memory'})[
      Symbol.asyncIterator
    ]();
    const pending = iterator.next();
    const rejected = expect(pending).rejects.toThrow(
      type === 'error'
        ? 'Worker batch processing failed'
        : 'Unexpected worker batch message: preload'
    );
    await Promise.resolve();
    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    harness.emit(type);
    await rejected;
    expect(returnInput).toHaveBeenCalledTimes(1);
  });

  test.each([
    'throw',
    'reject'
  ] as const)('early return aborts a leased job even if input cleanup will %s', async cleanup => {
    const harness = createJobHarness();
    const cleanupError = new Error('cleanup failed');
    const returnInput = vi.fn(() => {
      if (cleanup === 'throw') {
        throw cleanupError;
      }
      return Promise.reject(cleanupError);
    });
    const input = {[Symbol.asyncIterator]: () => ({next: vi.fn(), return: returnInput})};
    const iterator = processOnWorkerInBatches(worker, input, {source: 'in-memory'})[
      Symbol.asyncIterator
    ]();
    const pending = iterator.next();
    await Promise.resolve();
    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    harness.emit('output-batch', {result: 'one'});
    await expect(pending).resolves.toEqual({value: 'one', done: false});
    await iterator.return?.();
    await expect(harness.job.result).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Worker batch iterator was closed'
    });
    expect(harness.destroy).toHaveBeenCalledTimes(1);
    expect(returnInput).toHaveBeenCalledTimes(1);
  });

  test('input failures abort the job and preserve the original error', async () => {
    const harness = createJobHarness();
    const failure = new Error('input failed');
    const input = {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          throw failure;
        }
      })
    };
    const iterator = processOnWorkerInBatches(worker, input, {source: 'in-memory'})[
      Symbol.asyncIterator
    ]();
    const pending = iterator.next();
    const rejected = expect(pending).rejects.toBe(failure);
    await Promise.resolve();
    expect(harness.postMessage).toHaveBeenCalledTimes(1);
    harness.emit('input-request');
    await rejected;
    expect(harness.destroy).toHaveBeenCalledTimes(1);
  });
});

test('preload protocol ignores noise and rejects worker errors', async () => {
  const harness = createJobHarness();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const pending = preloadWorker(worker, {source: 'in-memory', core: {maxConcurrency: 1}});
  const rejected = expect(pending).rejects.toThrow('preload failed');
  await Promise.resolve();
  expect(harness.postMessage).toHaveBeenCalledTimes(1);
  harness.emit('input-request');
  expect(harness.job.isRunning).toBe(true);
  expect(warn).toHaveBeenCalledWith('process-on-worker: unknown preload message input-request');
  harness.emit('error', {error: 'preload failed'});
  await rejected;
});
