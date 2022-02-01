import test from 'tape-promise/tape';
import {WorkerThread} from '@loaders.gl/worker-utils';

export const WORKER_BODY_UTILS = `\
  function postMessageToParent(data) {
    if (typeof self !== 'undefined') {
      self.postMessage(data);
    } else {
      const {parentPort} = require('worker_threads');
      parentPort.postMessage(data);
    }
  }

  if (typeof self !== 'undefined') {
    self.onmessage = onMessage;
  } else {
    const {parentPort} = require('worker_threads');
    parentPort.on('message', onMessage);
  }
`;

const testWorkerSource = `
  console.log('in worker');
  function onMessage(event) {
    setTimeout(function () {
      console.log('timed out');
      postMessageToParent(event.data.payload)
      console.log('sent response');
    }, 50);
  }

  ${WORKER_BODY_UTILS}
`;

test('WorkerThread@create/destroy', async (t) => {
  if (!WorkerThread.isSupported()) {
    t.comment('Workers not supported, skipping tests');
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

test('WorkerThread#ping-pong', async (t) => {
  if (!WorkerThread.isSupported()) {
    t.comment('Workers not supported, skipping tests');
    t.end();
    return;
  }

  const testBuffer = new Float32Array(100).buffer;

  const workerThread = new WorkerThread({
    name: 'test-worker',
    source: testWorkerSource
  });

  const promise = new Promise((resolve) => {
    workerThread.onMessage = (message) => {
      t.comment('message returned');
      resolve(message);
    };
  });

  t.comment('message sent');
  workerThread.postMessage({type: 'test', data: testBuffer});

  t.comment('waiting');
  await promise;

  t.comment('terminating');
  workerThread.destroy();

  t.ok(workerThread.terminated);

  t.end();
});
