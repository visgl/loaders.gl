import {afterEach, describe, expect, test, vi} from 'vitest';
import {createWorker} from '../../../../src/worker-utils/lib/worker-api/create-worker';
import WorkerBody from '../../../../src/worker-utils/lib/worker-farm/worker-body';

type WorkerHandler = (type: any, payload: any) => Promise<void>;

describe('createWorker', () => {
  afterEach(() => vi.restoreAllMocks());

  test('ignores main-thread imports and handles preload and atomic work', async () => {
    const inWorkerThread = vi.spyOn(WorkerBody, 'inWorkerThread').mockResolvedValue(false);
    const setter = vi.spyOn(WorkerBody, 'onmessage', 'set');
    await createWorker(async value => value);
    expect(inWorkerThread).toHaveBeenCalledOnce();
    expect(setter).not.toHaveBeenCalled();

    const {handler, postMessage} = await installWorker(async (input, options, context) => {
      expect(options).toEqual({increment: 2});
      expect(context.process).toBeTypeOf('function');
      return input + options.increment;
    });
    await handler('preload', {});
    await handler('process', {input: 3, options: {increment: 2}, context: {source: 'test'}});

    expect(postMessage).toHaveBeenCalledWith('ready', {});
    expect(postMessage).toHaveBeenCalledWith('done', {});
    expect(postMessage).toHaveBeenCalledWith('done', expect.objectContaining({result: 5}));
  });

  test('streams batches with demand and output acknowledgements', async () => {
    const {handler, postMessage} = await installWorker(
      async input => input,
      async function* (batches) {
        for await (const batch of batches) {
          yield batch * 2;
        }
      }
    );

    const processing = handler('process-in-batches', {options: {}, context: {}});
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith('input-request', {}));
    await handler('input-batch', {input: 4});
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith('output-batch', {result: 8}));
    await handler('output-ack', {});
    await vi.waitFor(() =>
      expect(postMessage.mock.calls.filter(call => call[0] === 'input-request')).toHaveLength(2)
    );
    await handler('input-done', {});
    await processing;

    expect(postMessage).toHaveBeenLastCalledWith(
      'done',
      expect.objectContaining({executionMs: expect.any(Number)})
    );
  });

  test('reports unsupported work, inactive batch messages, and thrown values', async () => {
    const {handler, postMessage} = await installWorker(undefined as any);

    await handler('process', {input: 1});
    await handler('process-in-batches', {});
    await handler('input-batch', {input: 1});
    await handler('input-done', {});
    await handler('output-ack', {});
    await handler('unknown', {});

    expect(
      postMessage.mock.calls
        .filter(call => call[0] === 'error')
        .map(call => ({error: call[1].error}))
    ).toEqual([
      {error: 'Worker does not support atomic processing'},
      {error: 'Worker does not support batched processing'},
      {error: 'Worker has no active batched processing session'},
      {error: 'Worker has no active batched processing session'},
      {error: 'Worker has no active batched processing session'}
    ]);

    const throwingWorker = await installWorker(async () => {
      throw 'non-error';
    });
    await throwingWorker.handler('process', {input: 1});
    expect(throwingWorker.postMessage).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({error: ''})
    );
  });

  test('coalesces progress, preserves phase order, flushes completion, and ignores stale reports', async () => {
    let report;
    const {handler, postMessage} = await installWorker(async (_input, _options, context) => {
      report = context.reportProgress;
      report({phase: 'read', completed: 1, unit: 'bytes'});
      report({phase: 'read', completed: 2, unit: 'bytes'});
      report({phase: 'decode', completed: 0, total: 1, unit: 'tasks'});
      report({phase: 'decode', completed: 1, total: 1, unit: 'tasks'});
      return 'result';
    });
    await handler('process', {});
    report({phase: 'late', completed: 3, unit: 'bytes'});
    expect(postMessage.mock.calls).toEqual([
      ['ready', {}],
      ['progress', {progress: {phase: 'read', completed: 2, unit: 'bytes'}}],
      ['progress', {progress: {phase: 'decode', completed: 1, total: 1, unit: 'tasks'}}],
      ['done', {result: 'result', executionMs: expect.any(Number)}]
    ]);
  });

  test('routes nested processing requests through the main thread', async () => {
    let mainThreadListener: ((type: string, payload: any) => void) | undefined;
    vi.spyOn(WorkerBody, 'addEventListener').mockImplementation(async listener => {
      mainThreadListener = listener;
    });
    const removeEventListener = vi.spyOn(WorkerBody, 'removeEventListener').mockResolvedValue();
    const {handler, postMessage} = await installWorker(async (_input, _options, context) => {
      return await context.process(new Uint8Array([1]).buffer, {nested: true}, {loader: 'child'});
    });

    const processing = handler('process', {input: new ArrayBuffer(0)});
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith('process', expect.any(Object)));
    const nestedPayload = postMessage.mock.calls.find(call => call[0] === 'process')?.[1];
    mainThreadListener?.('done', {id: nestedPayload.id + 1, result: 'ignored'});
    mainThreadListener?.('done', {id: nestedPayload.id, result: 'nested result'});
    await processing;

    expect(removeEventListener).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith(
      'done',
      expect.objectContaining({result: 'nested result'})
    );
  });
});

/** Captures the worker message handler installed by createWorker. */
async function installWorker(process?: any, processInBatches?: any) {
  let handler: WorkerHandler | undefined;
  vi.spyOn(WorkerBody, 'inWorkerThread').mockResolvedValue(true);
  vi.spyOn(WorkerBody, 'onmessage', 'set').mockImplementation(value => {
    handler = value as WorkerHandler;
  });
  const postMessage = vi.spyOn(WorkerBody, 'postMessage').mockResolvedValue();
  await createWorker(process, processInBatches);
  return {handler: handler!, postMessage};
}
