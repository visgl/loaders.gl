import {expect, test, vi} from 'vitest';
import {
  canProcessOnWorker,
  processOnWorker,
  processOnWorkerInBatches,
  preloadWorker,
  NullWorker,
  WorkerBody,
  isBrowser
} from '@loaders.gl/core/worker-utils';
import type {WorkerObject} from '../../../../src/worker-utils/types';

const moduleWorkerSource = `
  self.onmessage = function(event) {
    if (event.data.type === 'process') {
      self.postMessage({
        source: 'loaders.gl',
        type: 'done',
        payload: {result: event.data.payload.input}
      });
    }
  };
`;

const moduleBatchWorkerSource = `
  self.onmessage = function(event) {
    switch (event.data.type) {
      case 'process-in-batches':
      case 'output-ack':
        self.postMessage({source: 'loaders.gl', type: 'input-request', payload: {}});
        break;
      case 'input-batch':
        self.postMessage({
          source: 'loaders.gl',
          type: 'output-batch',
          payload: {result: event.data.payload.input * 2}
        });
        break;
      case 'input-done':
        self.postMessage({source: 'loaders.gl', type: 'done', payload: {}});
        break;
    }
  };
`;
test.runIf(isBrowser)('canProcessOnWorker#custom worker URL', () => {
  const MainThreadLoader = {...NullWorker, worker: false};
  expect(
    canProcessOnWorker(MainThreadLoader, {worker: true}),
    'defaults to the main thread'
  ).toBeFalsy();
  expect(
    canProcessOnWorker(MainThreadLoader, {worker: true, null: {workerUrl: 'custom-worker.js'}}),
    'a custom worker URL opts into worker processing'
  ).toBeTruthy();
  expect(
    canProcessOnWorker({...MainThreadLoader, loadWorker: () => null}, {worker: true}),
    'a built-in worker factory opts into worker processing'
  ).toBeTruthy();
});
test.runIf(isBrowser)('processOnWorker', async () => {
  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test'
  });
  expect(nullData, 'NullWorker verified').toBe('abc');
});
test.runIf(isBrowser)('processOnWorker uses a built-in worker factory', async () => {
  let loadWorkerCalls = 0;
  const ModuleNullWorker: WorkerObject = {
    ...NullWorker,
    id: 'module-null',
    name: 'module null',
    worker: 'modules/core/dist/worker-utils/null-worker.js',
    loadWorker: () => {
      loadWorkerCalls++;
      const workerUrl = URL.createObjectURL(
        new Blob([moduleWorkerSource], {type: 'application/javascript'})
      );
      return new Worker(workerUrl, {type: 'module'});
    },
    options: {'module-null': {}}
  };

  const result = await processOnWorker(ModuleNullWorker, 'abc', {reuseWorkers: false});

  expect(loadWorkerCalls).toBe(1);
  expect(result).toBe('abc');
});
test.runIf(isBrowser)('URL overrides take precedence over a built-in worker factory', async () => {
  let loadWorkerCalls = 0;
  const ModuleNullWorker: WorkerObject = {
    ...NullWorker,
    loadWorker: () => {
      loadWorkerCalls++;
      return null;
    }
  };

  for (const options of [
    {null: {workerUrl: 'modules/core/dist/worker-utils/null-worker.js'}, reuseWorkers: false},
    {_workerType: 'test', reuseWorkers: false}
  ]) {
    await expect(processOnWorker(ModuleNullWorker, 'abc', options)).resolves.toBe('abc');
  }

  expect(loadWorkerCalls).toBe(0);
});
test.runIf(isBrowser)('processOnWorkerInBatches uses a built-in worker factory', async () => {
  const ModuleBatchWorker: WorkerObject = {
    ...NullWorker,
    id: 'module-batch',
    name: 'module batch',
    worker: true,
    loadWorker: () => {
      const workerUrl = URL.createObjectURL(
        new Blob([moduleBatchWorkerSource], {type: 'application/javascript'})
      );
      return new Worker(workerUrl, {type: 'module'});
    },
    options: {'module-batch': {}}
  };
  const results: number[] = [];

  for await (const result of processOnWorkerInBatches<number, number>(
    ModuleBatchWorker,
    [1, 2, 3],
    {reuseWorkers: false}
  )) {
    results.push(result);
  }

  expect(results).toEqual([2, 4, 6]);
});
test.runIf(isBrowser)('preloadWorker', async () => {
  let startedWorkers = 0;
  await preloadWorker(
    NullWorker,
    {
      _workerType: 'test',
      maxConcurrency: 3,
      reuseWorkers: true,
      onDebug: () => {
        startedWorkers++;
      }
    },
    {count: 3}
  );
  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test',
    maxConcurrency: 3,
    reuseWorkers: true
  });
  expect(startedWorkers >= 3, 'preloaded three worker jobs').toBeTruthy();
  expect(nullData, 'preloaded worker pool can process later jobs').toBe('abc');
});
test.runIf(isBrowser)('preloadWorker handles count above maxConcurrency', async () => {
  await Promise.race([
    preloadWorker(
      NullWorker,
      {
        _workerType: 'test',
        maxConcurrency: 2,
        reuseWorkers: true
      },
      {count: 5}
    ),
    new Promise((_, reject) => setTimeout(() => reject(new Error('preloadWorker timed out')), 2000))
  ]);
  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test',
    maxConcurrency: 2,
    reuseWorkers: true
  });
  expect(nullData, 'preloaded constrained worker pool can process later jobs').toBe('abc');
});

test('WorkerBody filters browser messages and manages listeners', async () => {
  const receivedMessages: Array<{type: string; payload: unknown}> = [];
  const onMessage = (type: string, payload: unknown): void => {
    receivedMessages.push({type, payload});
  };

  await WorkerBody.removeEventListener(onMessage);
  await WorkerBody.addEventListener(onMessage);
  await WorkerBody.addEventListener(onMessage);

  globalThis.dispatchEvent(
    new MessageEvent('message', {
      data: {source: 'unrelated', type: 'done', payload: {result: 'ignored'}}
    })
  );
  globalThis.dispatchEvent(
    new MessageEvent('message', {
      data: {source: 'loaders.gl', type: 'done', payload: {result: 'accepted'}}
    })
  );

  expect(receivedMessages).toEqual([{type: 'done', payload: {result: 'accepted'}}]);
  await WorkerBody.removeEventListener(onMessage);
  await WorkerBody.removeEventListener(onMessage);
});

const progressWorkerSource = `
self.onmessage = ({data}) => {
  self.postMessage({source: 'loaders.gl', type: 'progress', payload: {progress: {phase: 'decode', completed: 1, total: 1, unit: 'tasks'}}});
  self.postMessage({source: 'loaders.gl', type: 'done', payload: {result: data.payload.input}});
  self.postMessage({source: 'loaders.gl', type: 'progress', payload: {progress: {phase: 'late', completed: 2, unit: 'tasks'}}});
};
`;

test('progress precedes completion, is not serialized, and stops at settlement', async () => {
  const progress = vi.fn();
  const result = await processOnWorker(NullWorker, 'done', {
    source: progressWorkerSource,
    onProgress: progress,
    reuseWorkers: false
  });
  expect(result).toBe('done');
  expect(progress.mock.calls).toEqual([[{phase: 'decode', completed: 1, total: 1, unit: 'tasks'}]]);
});

test('a throwing progress callback rejects and leaves the pool usable', async () => {
  const reason = new Error('callback failed');
  await expect(
    processOnWorker(NullWorker, 'first', {
      source: progressWorkerSource,
      onProgress: () => {
        throw reason;
      }
    })
  ).rejects.toBe(reason);
  await expect(processOnWorker(NullWorker, 'second', {source: progressWorkerSource})).resolves.toBe(
    'second'
  );
});

test('already aborted processing does not detach its input', async () => {
  const controller = new AbortController();
  controller.abort();
  const input = new ArrayBuffer(8);
  await expect(processOnWorker(NullWorker, input, {signal: controller.signal})).rejects.toBe(
    controller.signal.reason
  );
  expect(input.byteLength).toBe(8);
});
