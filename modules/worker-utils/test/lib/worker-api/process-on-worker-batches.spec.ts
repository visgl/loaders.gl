import {expect, test} from 'vitest';
import {NullWorker, processOnWorkerInBatches, WorkerFarm} from '@loaders.gl/worker-utils';

test('processOnWorkerInBatches keeps state on one worker', async () => {
  const outputBatches = processOnWorkerInBatches(NullWorker, ['first', 'second', 'third'], {
    worker: true,
    _workerType: 'test',
    maxConcurrency: 2,
    reuseWorkers: true
  });

  const results = [];
  for await (const outputBatch of outputBatches) {
    results.push(outputBatch);
  }

  expect(results).toEqual([
    {input: 'first', batchIndex: 0},
    {input: 'second', batchIndex: 1},
    {input: 'third', batchIndex: 2}
  ]);
  WorkerFarm.getWorkerFarm().destroy();
});

test('processOnWorkerInBatches accepts async input and applies output backpressure', async () => {
  let inputPullCount = 0;
  const input = {
    async *[Symbol.asyncIterator]() {
      for (const value of ['async-first', 'async-second']) {
        inputPullCount++;
        yield value;
      }
    }
  };
  const results = [];
  for await (const output of processOnWorkerInBatches(NullWorker, input, {
    worker: true,
    _workerType: 'test'
  })) {
    results.push(output);
  }

  expect(results).toEqual([
    {input: 'async-first', batchIndex: 0},
    {input: 'async-second', batchIndex: 1}
  ]);
  expect(inputPullCount).toBe(2);
});

test('processOnWorkerInBatches closes and aborts an active session early', async () => {
  const outputIterator = processOnWorkerInBatches(NullWorker, ['first', 'second'], {
    worker: true,
    _workerType: 'test'
  })[Symbol.asyncIterator]();

  await outputIterator.next();
  await outputIterator.return?.();
});

test('processOnWorkerInBatches propagates input iterator failures', async () => {
  const input = {
    async *[Symbol.asyncIterator]() {
      yield 'first';
      throw new Error('input failed');
    }
  };

  await expect(
    (async () => {
      for await (const _output of processOnWorkerInBatches(NullWorker, input, {
        worker: true,
        _workerType: 'test'
      })) {
        // Consume until the source fails.
      }
    })()
  ).rejects.toThrow('input failed');
});
