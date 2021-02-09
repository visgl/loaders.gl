import test from 'tape-catch';
import WorkerThread from '@loaders.gl/worker-utils/lib/worker-farm/worker-thread';

const hasWorker = typeof Worker !== 'undefined';
const testWorkerSource = `
  self.onmessage = function(event) {
    setTimeout(function () { self.postMessage(event.data.payload); }, 50);
  };
`;

test('WorkerThread', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const testBuffer = new Float32Array(100).buffer;

  const workerThread = new WorkerThread({
    name: 'test-worker',
    source: testWorkerSource
  });

  workerThread.postMessage({type: 'test', data: testBuffer});

  workerThread.destroy();

  t.ok(workerThread.terminated);

  t.end();
});
