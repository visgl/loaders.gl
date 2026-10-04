// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import WorkerBody from '../../../src/lib/worker-farm/worker-body';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('message listeners filter invalid envelopes and accept direct worker data', async () => {
  const received = vi.fn();
  const addListener = vi.spyOn(globalThis, 'addEventListener').mockImplementation(() => {});
  const removeListener = vi.spyOn(globalThis, 'removeEventListener').mockImplementation(() => {});
  await WorkerBody.addEventListener(received);
  try {
    const listener = addListener.mock.calls[0][1] as (message: unknown) => void;
    for (const message of [
      null,
      4,
      'noise',
      {},
      {source: 7},
      {source: 'other'},
      {type: 'message', data: null},
      {type: 'message', data: {source: false}}
    ]) {
      listener(message);
    }
    expect(received).not.toHaveBeenCalled();
    listener({source: 'loaders.gl:child', type: 'done', payload: {result: 1}});
    listener({
      type: 'message',
      data: {source: 'loaders.gl', type: 'error', payload: {error: 'failed'}}
    });
    expect(received.mock.calls).toEqual([
      ['done', {result: 1}],
      ['error', {error: 'failed'}]
    ]);
    await WorkerBody.addEventListener(received);
    expect(addListener.mock.calls[1][1]).toBe(listener);
    await WorkerBody.removeEventListener(received);
    expect(removeListener).toHaveBeenCalledWith('message', listener);
    await WorkerBody.removeEventListener(received);
    expect(removeListener).toHaveBeenCalledTimes(1);
  } finally {
    await WorkerBody.removeEventListener(received);
  }
});

test('worker postMessage transfers backing buffers once', async () => {
  const postMessage = vi.fn();
  vi.stubGlobal('postMessage', postMessage);
  const buffer = new ArrayBuffer(4);
  const payload = {input: new Uint8Array(buffer), result: buffer};
  await WorkerBody.postMessage('done', payload);
  expect(postMessage).toHaveBeenCalledExactlyOnceWith(
    {
      source: 'loaders.gl',
      type: 'done',
      payload
    },
    [buffer]
  );
});
