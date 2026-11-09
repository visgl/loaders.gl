// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {TaskContext} from '@math.gl/tasks';
import {createWorkerTask} from '../../../../src/worker-utils/lib/worker-api/create-worker';
import type {WorkerTaskState} from '../../../../src/worker-utils/lib/worker-api/task-runtime';

/** Creates the services provided by the task runtime to one adapter invocation. */
function createTaskContext(
  port?: MessagePort,
  controller = new AbortController()
): TaskContext<WorkerTaskState> {
  return {
    state: {context: {url: 'nested'}, ...(port ? {port} : {})},
    signal: controller.signal,
    throwIfAborted: () => controller.signal.throwIfAborted(),
    reportProgress: vi.fn()
  };
}

test('worker task hooks adapt named payloads, streaming values, context and progress', async () => {
  const context = createTaskContext();
  const options = {marker: 1};
  const task = createWorkerTask(
    async (input, parserOptions, workerContext, loaderContext) => {
      workerContext?.throwIfAborted?.();
      workerContext?.reportProgress?.({completed: 1});
      expect(workerContext?.process).toBeUndefined();
      return {input, parserOptions, loaderContext};
    },
    async function* (inputs, parserOptions, _workerContext, loaderContext) {
      for await (const input of inputs) yield {input, parserOptions, loaderContext};
    }
  );
  expect(await task.initialize!(context.state, {} as any)).toBe(context.state);
  expect(await task.process!({value: 'atomic'}, options, context)).toEqual({
    value: {input: 'atomic', parserOptions: options, loaderContext: {url: 'nested'}}
  });
  expect(context.reportProgress).toHaveBeenCalledWith({
    completed: 1,
    phase: 'process',
    unit: 'items'
  });
  const output = [];
  async function* inputs() {
    yield {value: 'batch'};
  }
  for await (const batch of task.processInBatches!(inputs(), options, context)) output.push(batch);
  expect(output).toEqual([
    {value: {input: 'batch', parserOptions: options, loaderContext: {url: 'nested'}}}
  ]);
  await task.destroy!(context.state);
});

test('worker callbacks match replies and preserve caller error names and messages', async () => {
  const channel = new MessageChannel();
  const context = createTaskContext(channel.port1);
  const task = createWorkerTask(
    async (input, options, workerContext, loaderContext) =>
      await workerContext?.process?.(input, options, loaderContext)
  );
  channel.port2.onmessage = ({data}) => {
    expect(data.context).toEqual({url: 'nested'});
    channel.port2.postMessage({identifier: data.identifier + 1, value: 'unrelated'});
    channel.port2.postMessage(
      data.options.fail
        ? {identifier: data.identifier, error: {name: 'TypeError', message: 'caller failed'}}
        : {identifier: data.identifier, value: data.input}
    );
  };
  try {
    const input = new Uint8Array([7]);
    expect(await task.process!({value: input}, {}, context)).toEqual({value: new Uint8Array([7])});
    expect(input.byteLength).toBe(0);
    await expect(task.process!({value: 'bad'}, {fail: true}, context)).rejects.toMatchObject({
      name: 'TypeError',
      message: 'caller failed'
    });
  } finally {
    await task.destroy!(context.state);
    channel.port2.close();
  }
});

test('worker callbacks reject cancellation and uncloneable requests without hanging', async () => {
  const channel = new MessageChannel();
  const controller = new AbortController();
  const context = createTaskContext(channel.port1, controller);
  const task = createWorkerTask(
    async (input, _options, workerContext) => await workerContext?.process?.(input)
  );
  try {
    await expect(task.process!({value: () => {}}, {}, context)).rejects.toMatchObject({
      name: 'DataCloneError'
    });
    const received = new Promise<void>(resolve => {
      channel.port2.onmessage = () => resolve();
    });
    const request = task.process!({value: 'pending'}, {}, context);
    const reason = new Error('cancel callback');
    const rejection = expect(request).rejects.toBe(reason);
    await received;
    controller.abort(reason);
    await rejection;
    await expect(task.process!({value: 'after abort'}, {}, context)).rejects.toBe(reason);
  } finally {
    await task.destroy!(context.state);
    channel.port2.close();
  }
});
