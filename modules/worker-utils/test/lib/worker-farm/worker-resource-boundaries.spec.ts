// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import WorkerThread from '../../../src/lib/worker-farm/worker-thread';

/** Supplies browser Worker methods without starting a thread or loading a resource. */
function createWorkerStub() {
  return {
    terminate: vi.fn(),
    postMessage: vi.fn(),
    onmessage: null,
    onerror: null,
    onmessageerror: null
  } as unknown as Worker;
}

afterEach(() => vi.restoreAllMocks());

test('worker callbacks handle missing messages and factory load errors', () => {
  const worker = createWorkerStub();
  const thread = new WorkerThread({name: 'resource-boundary', loadWorker: () => worker});
  const onError = vi.fn();
  const onMessage = vi.fn();
  thread.onError = onError;
  thread.onMessage = onMessage;
  worker.onmessage?.({data: null} as MessageEvent);
  expect(onError.mock.calls[0][0].message).toBe('No data received');
  worker.onmessage?.({data: {result: 1}} as MessageEvent);
  expect(onMessage).toHaveBeenCalledWith({result: 1});
  worker.onerror?.({message: 'failed', lineno: 3, colno: 9} as ErrorEvent);
  expect(onError.mock.calls[1][0].message).toBe(
    'Failed to load worker resource-boundary from built-in worker factory. failed in :3:9'
  );
  expect(thread.terminated).toBe(true);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const messageError = {type: 'messageerror'} as MessageEvent;
  worker.onmessageerror?.(messageError);
  expect(consoleError).toHaveBeenCalledWith(messageError);
  thread.destroy();
  worker.onmessage?.({data: {result: 'late'}} as MessageEvent);
  expect(onMessage).toHaveBeenCalledTimes(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});

test('a factory error without a fallback preserves the original error', () => {
  const failure = new Error('factory failed');
  expect(
    () =>
      new WorkerThread({
        name: 'failed-factory',
        loadWorker: () => {
          throw failure;
        }
      })
  ).toThrow(failure);
});

test('a failed factory lazily uses the URL fallback and forwards transfer lists', () => {
  const worker = createWorkerStub();
  const constructWorker = vi.fn(function () {
    return worker;
  });
  vi.stubGlobal('Worker', constructWorker);
  try {
    const getUrl = vi.fn(() => 'blob:in-memory-worker');
    const thread = new WorkerThread({
      name: 'fallback',
      getUrl,
      loadWorker: () => {
        throw new Error('factory failed');
      }
    });
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(constructWorker).toHaveBeenCalledWith('blob:in-memory-worker', {name: 'fallback'});
    const buffer = new ArrayBuffer(4);
    thread.postMessage({buffer}, [buffer]);
    expect(worker.postMessage).toHaveBeenCalledWith({buffer}, [buffer]);
    expect(thread._getErrorFromErrorEvent({} as ErrorEvent).message).toBe(
      'Failed to load worker fallback from built-in worker factory. '
    );
    thread.destroy();
  } finally {
    vi.unstubAllGlobals();
  }
});
