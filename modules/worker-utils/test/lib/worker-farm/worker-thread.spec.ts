import {expect, test} from 'vitest';
import {WorkerThread} from '@loaders.gl/worker-utils';
const hasWorker = typeof Worker !== 'undefined';
const testWorkerSource = `
  self.onmessage = function(event) {
    setTimeout(function () { self.postMessage(event.data.payload); }, 50);
  };
`;
test('WorkerThread', async () => {
  if (!hasWorker) {
    console.log('Worker test is browser only');
    return;
  }
  const testBuffer = new Float32Array(100).buffer;
  const workerThread = new WorkerThread({
    name: 'test-worker',
    source: testWorkerSource
  });
  workerThread.postMessage({type: 'test', data: testBuffer});
  workerThread.destroy();
  expect(workerThread.terminated).toBeTruthy();
});
test('WorkerThread accepts a built-in worker factory', () => {
  if (!hasWorker) {
    return;
  }
  let loadWorkerCalls = 0;
  const workerThread = new WorkerThread({
    name: 'module-worker',
    loadWorker: () => {
      loadWorkerCalls++;
      const workerUrl = URL.createObjectURL(
        new Blob([testWorkerSource], {type: 'application/javascript'})
      );
      return new Worker(workerUrl, {type: 'module'});
    }
  });

  expect(loadWorkerCalls).toBe(1);
  workerThread.destroy();
  expect(workerThread.terminated).toBeTruthy();
});
test('WorkerThread falls back when the built-in worker factory returns null', () => {
  if (!hasWorker) {
    return;
  }
  const workerThread = new WorkerThread({
    name: 'module-worker-fallback',
    loadWorker: () => null,
    source: testWorkerSource
  });

  workerThread.destroy();
  expect(workerThread.terminated).toBeTruthy();
});
