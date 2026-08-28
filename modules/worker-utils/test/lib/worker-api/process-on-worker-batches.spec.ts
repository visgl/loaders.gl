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
