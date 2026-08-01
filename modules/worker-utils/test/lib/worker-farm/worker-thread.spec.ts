// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {WorkerThread} from '@loaders.gl/worker-utils';

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

test('WorkerThread#loadWorker', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  let loadWorkerCalls = 0;
  const workerThread = new WorkerThread({
    name: 'test-worker',
    loadWorker: () => {
      loadWorkerCalls++;
      const workerSourceUrl = URL.createObjectURL(
        new Blob([testWorkerSource], {type: 'application/javascript'})
      );
      return new Worker(workerSourceUrl);
    }
  });

  t.equal(loadWorkerCalls, 1, 'loadWorker creates the browser Worker');

  workerThread.destroy();
  t.ok(workerThread.terminated);
  t.end();
});

test('WorkerThread#loadWorker falls back to source', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const workerThread = new WorkerThread({
    name: 'test-worker',
    loadWorker: () => null,
    source: testWorkerSource
  });

  workerThread.destroy();
  t.ok(workerThread.terminated);
  t.end();
});

test('WorkerThread#loadWorker falls back to source after construction error', async t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const workerThread = new WorkerThread({
    name: 'test-worker',
    loadWorker: () => {
      throw new Error('loadWorker failed');
    },
    source: testWorkerSource
  });

  workerThread.destroy();
  t.ok(workerThread.terminated);
  t.end();
});
