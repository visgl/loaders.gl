import {expect, test, vi} from 'vitest';
import {NullWorker, processOnWorkerInBatches, WorkerFarm} from '@loaders.gl/core/worker-utils';

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

test('aborting blocked streaming input requests cleanup without awaiting it', async () => {
  const controller = new AbortController();
  const cleanup = vi.fn(() => new Promise<IteratorResult<string>>(() => {}));
  let markRequested!: () => void;
  const requested = new Promise<void>(resolve => {
    markRequested = resolve;
  });
  const input = {
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          markRequested();
          return new Promise<IteratorResult<string>>(() => {});
        },
        return: cleanup
      };
    }
  };
  const output = processOnWorkerInBatches(NullWorker, input, {
    _workerType: 'test',
    signal: controller.signal
  })[Symbol.asyncIterator]();
  const next = output.next();
  await requested;
  controller.abort('stop blocked input');
  await expect(next).rejects.toBe('stop blocked input');
  expect(cleanup).toHaveBeenCalledOnce();
});

test('aborting a paused output iterator closes its input exactly once', async () => {
  const controller = new AbortController();
  const cleanup = vi.fn(async () => ({done: true as const, value: undefined}));
  const input = {
    [Symbol.asyncIterator]() {
      return {next: async () => ({done: false as const, value: 'first'}), return: cleanup};
    }
  };
  const output = processOnWorkerInBatches(NullWorker, input, {
    _workerType: 'test',
    signal: controller.signal
  })[Symbol.asyncIterator]();
  expect((await output.next()).done).toBe(false);
  controller.abort('cancel paused output');
  await vi.waitFor(() => expect(cleanup).toHaveBeenCalledOnce());
  await output.return?.();
  expect(cleanup).toHaveBeenCalledOnce();
});

test('batched worker progress is delivered before each output batch', async () => {
  const onProgress = vi.fn();
  const source = `
    let completed = 0;
    const send = (type, payload = {}) => self.postMessage({source: 'loaders.gl', type, payload});
    self.onmessage = ({data: {type, payload}}) => {
      switch (type) {
        case 'process-in-batches':
        case 'output-ack':
          send('input-request');
          break;
        case 'input-batch':
          send('progress', {progress: {phase: 'parse', completed: ++completed, unit: 'batches'}});
          send('output-batch', {result: payload.input});
          break;
        case 'input-done':
          send('done');
          break;
      }
    };
  `;
  const outputs = [];
  for await (const output of processOnWorkerInBatches(NullWorker, [1, 2], {
    source,
    onProgress,
    reuseWorkers: false
  })) {
    expect(onProgress).toHaveBeenLastCalledWith({
      phase: 'parse',
      completed: output,
      unit: 'batches'
    });
    outputs.push(output);
  }
  expect(outputs).toEqual([1, 2]);
  expect(onProgress).toHaveBeenCalledTimes(2);
});
