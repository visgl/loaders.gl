import {expect, test} from 'vitest';
import {
  canProcessOnWorker,
  processOnWorker,
  preloadWorker,
  NullWorker,
  isBrowser
} from '@loaders.gl/worker-utils';
test('canProcessOnWorker#custom worker URL', () => {
  if (!isBrowser) {
    return;
  }
  const MainThreadLoader = {...NullWorker, worker: false};
  expect(
    canProcessOnWorker(MainThreadLoader, {worker: true}),
    'defaults to the main thread'
  ).toBeFalsy();
  expect(
    canProcessOnWorker(MainThreadLoader, {worker: true, null: {workerUrl: 'custom-worker.js'}}),
    'a custom worker URL opts into worker processing'
  ).toBeTruthy();
});
test('processOnWorker', async () => {
  if (!isBrowser) {
    return;
  }
  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test'
  });
  expect(nullData, 'NullWorker verified').toBe('abc');
});
test('preloadWorker', async () => {
  if (!isBrowser) {
    return;
  }
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
test('preloadWorker handles count above maxConcurrency', async () => {
  if (!isBrowser) {
    return;
  }
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
