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
