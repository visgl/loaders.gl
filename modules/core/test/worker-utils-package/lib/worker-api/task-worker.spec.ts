// SPDX-License-Identifier: MIT
import {afterEach, expect, test, vi} from 'vitest';
import {
  NullWorker,
  processOnWorker,
  processOnWorkerInBatches,
  preloadWorker,
  canProcessOnWorker,
  canProcessOnWorkerInBatches,
  destroyWorkerTasks,
  type WorkerObject
} from '@loaders.gl/core/worker-utils';

const url = new URL(
  '/modules/core/test/worker-utils-package/fixtures/task-worker.ts',
  location.href
).href;
const worker: WorkerObject = {...NullWorker, worker: url, workerInBatches: true};
afterEach(() => destroyWorkerTasks());

test('task adapter routes named payloads, separate parser options, progress, and context', async () => {
  const onProgress = vi.fn();
  await expect(
    processOnWorker(worker, new Uint8Array([1, 2]), {onProgress}, {}, {source: 'caller'})
  ).resolves.toEqual({
    input: new Uint8Array([1, 2]),
    context: {source: 'caller'}
  });
  expect(onProgress).toHaveBeenCalledExactlyOnceWith({
    phase: 'parse',
    completed: 1,
    total: 1,
    unit: 'items'
  });
});

test('task adapter resolves caller callbacks and preserves their errors', async () => {
  const process = vi.fn(async (input, options, _context, jobContext) => ({
    input,
    marker: options.marker,
    jobContext
  }));
  await expect(
    processOnWorker(worker, 'input', {callback: true, marker: 3}, {process}, {resource: 'file'})
  ).resolves.toEqual({
    input: 'input',
    marker: 3,
    jobContext: {resource: 'file'}
  });
  await expect(
    processOnWorker(
      worker,
      'input',
      {callback: true},
      {
        process: async () => {
          throw new TypeError('callback failed');
        }
      }
    )
  ).rejects.toThrow('callback failed');
  await expect(processOnWorker(worker, 'input', {fail: true})).rejects.toThrow('task failed');
});

test('task adapter copies or transfers inputs as requested', async () => {
  const copied = new Uint8Array([1]);
  await processOnWorker(worker, copied, {inputOwnership: 'copy'});
  expect(copied.byteLength).toBe(1);
  const transferred = new Uint8Array([2]);
  await processOnWorker(worker, transferred);
  expect(transferred.byteLength).toBe(0);
});

test('streaming retains context and state on one handle and reports final progress', async () => {
  const onProgress = vi.fn();
  const results = [];
  for await (const result of processOnWorkerInBatches(
    worker,
    ['a', 'b'],
    {marker: 4, onProgress},
    {},
    {source: 'stream'}
  )) {
    results.push(result);
  }
  expect(onProgress).toHaveBeenLastCalledWith({phase: 'parse', completed: 2, unit: 'batches'});
  expect(results).toEqual([
    {input: 'a', batchIndex: 1, context: {source: 'stream'}, option: 4},
    {input: 'b', batchIndex: 2, context: {source: 'stream'}, option: 4}
  ]);
});

test('aborted queued and active handles preserve reasons and release capacity', async () => {
  const reason = new Error('stop task');
  const active = new AbortController();
  const first = processOnWorker(worker, 'a', {
    delay: 5000,
    maxConcurrency: 1,
    signal: active.signal
  });
  const queued = new AbortController();
  const second = processOnWorker(worker, 'b', {signal: queued.signal});
  queued.abort(reason);
  await expect(second).rejects.toBe(reason);
  active.abort(reason);
  await expect(first).rejects.toBe(reason);
  await expect(processOnWorker(worker, 'c')).resolves.toMatchObject({input: 'c'});
});

test('factories, explicit URL overrides, preload, and teardown use public task lifecycles', async () => {
  const loadWorker = vi.fn(() => new Worker(url, {type: 'module'}));
  const factory = {...worker, loadWorker};
  await processOnWorker(factory, 'factory');
  expect(loadWorker).toHaveBeenCalledOnce();
  await processOnWorker(factory, 'override', {null: {workerUrl: url}});
  expect(loadWorker).toHaveBeenCalledOnce();
  await preloadWorker(worker);
  await destroyWorkerTasks();
  await expect(processOnWorker(worker, 'after teardown')).resolves.toMatchObject({
    input: 'after teardown'
  });
  await expect(
    processOnWorker(worker, 'legacy', {source: 'self.onmessage = () => {}'})
  ).rejects.toThrow('Inline legacy');
});

test('routing requires explicit opt-in and custom streaming capability', () => {
  expect(canProcessOnWorker(worker)).toBe(false);
  expect(canProcessOnWorker(worker, {worker: true})).toBe(true);
  expect(canProcessOnWorker({...worker, worker: false}, {worker: true})).toBe(false);
  expect(canProcessOnWorkerInBatches(worker, {worker: true})).toBe(true);
  expect(canProcessOnWorkerInBatches(worker, {worker: true, null: {workerUrl: url}})).toBe(false);
  expect(
    canProcessOnWorkerInBatches(worker, {
      worker: true,
      workerInBatches: true,
      null: {workerUrl: url}
    })
  ).toBe(true);
});
