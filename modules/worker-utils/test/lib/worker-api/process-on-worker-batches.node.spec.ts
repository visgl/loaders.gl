import {expect, test} from 'vitest';
import {processOnWorkerInBatches} from '@loaders.gl/worker-utils';

const StatefulBatchWorker = {
  id: 'stateful-batch-test',
  name: 'stateful-batch-test',
  module: 'worker-utils',
  version: 'latest',
  worker: true,
  options: {}
};

const statefulBatchWorkerSource = `
const {parentPort, threadId} = require('worker_threads');

let batchIndex = 0;

function post(type, payload = {}) {
  parentPort.postMessage({source: 'loaders.gl', type, payload});
}

parentPort.on('message', message => {
  const {type, payload} = message;
  if (type === 'process-in-batches') {
    batchIndex = 0;
    post('input-request');
  } else if (type === 'input-batch') {
    post('output-batch', {result: {input: payload.input, batchIndex, threadId}});
    batchIndex++;
  } else if (type === 'output-ack') {
    post('input-request');
  } else if (type === 'input-done') {
    post('done');
  }
});
`;

test('processOnWorkerInBatches leases one worker and applies backpressure', async () => {
  let inputPullCount = 0;
  const input = {
    async *[Symbol.asyncIterator]() {
      for (const value of ['first', 'second', 'third']) {
        inputPullCount++;
        yield value;
      }
    }
  };
  const outputIterator = processOnWorkerInBatches(StatefulBatchWorker, input, {
    worker: true,
    source: statefulBatchWorkerSource,
    maxConcurrency: 2,
    reuseWorkers: true
  })[Symbol.asyncIterator]();

  const firstOutput = await outputIterator.next();
  expect(firstOutput.value).toMatchObject({input: 'first', batchIndex: 0});
  expect(inputPullCount).toBe(1);

  const secondOutput = await outputIterator.next();
  expect(secondOutput.value).toMatchObject({input: 'second', batchIndex: 1});
  expect(secondOutput.value.threadId).toBe(firstOutput.value.threadId);
  expect(inputPullCount).toBe(2);

  await outputIterator.return?.();

  const replacementResults = [];
  for await (const output of processOnWorkerInBatches(StatefulBatchWorker, ['replacement'], {
    worker: true,
    source: statefulBatchWorkerSource,
    maxConcurrency: 2,
    reuseWorkers: true
  })) {
    replacementResults.push(output);
  }
  expect(replacementResults).toHaveLength(1);
  expect(replacementResults[0]).toMatchObject({input: 'replacement', batchIndex: 0});
});

test('processOnWorkerInBatches preserves an active AbortSignal reason', async () => {
  const controller = new AbortController();
  const reason = new Error('cancel stateful worker');
  reason.name = 'AbortError';
  const outputIterator = processOnWorkerInBatches(StatefulBatchWorker, ['first', 'second'], {
    worker: true,
    source: statefulBatchWorkerSource,
    signal: controller.signal
  })[Symbol.asyncIterator]();

  expect((await outputIterator.next()).value).toMatchObject({input: 'first'});
  controller.abort(reason);
  await expect(outputIterator.next()).rejects.toBe(reason);
});
