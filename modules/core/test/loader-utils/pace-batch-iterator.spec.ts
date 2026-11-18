// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {paceBatchIterator} from '@loaders.gl/core/loader-utils';

test('paces unequal batches by rows without accumulating time during a stall', async () => {
  vi.useFakeTimers({toFake: ['performance', 'setTimeout', 'clearTimeout']});
  const iterator = paceBatchIterator([50, undefined, 25, 100, 10], {
    batchMaxRowsPerSecond: 100,
    getRowCount: batch => batch
  })[Symbol.asyncIterator]();
  try {
    expect((await iterator.next()).value).toBe(50);
    expect((await iterator.next()).value).toBeUndefined();
    const second = vi.fn();
    const pending = iterator.next().then(second);
    await vi.advanceTimersByTimeAsync(499);
    expect(second).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(second).toHaveBeenCalledWith({done: false, value: 25});
    await vi.advanceTimersByTimeAsync(5000);
    expect((await iterator.next()).value).toBe(100);
    const fourth = vi.fn();
    const final = iterator.next().then(fourth);
    await vi.advanceTimersByTimeAsync(999);
    expect(fourth).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await final;
    expect((await iterator.next()).done).toBe(true);
  } finally {
    await iterator.return?.();
    vi.useRealTimers();
  }
});

test('abort clears the pacing timer and closes upstream', async () => {
  vi.useFakeTimers({toFake: ['performance', 'setTimeout', 'clearTimeout']});
  const controller = new AbortController();
  const closed = vi.fn();
  const source = (function* () {
    try {
      yield 100;
      yield 100;
    } finally {
      closed();
    }
  })();
  const iterator = paceBatchIterator(source, {
    batchMaxRowsPerSecond: 100,
    getRowCount: batch => batch,
    signal: controller.signal
  })[Symbol.asyncIterator]();
  try {
    await iterator.next();
    const pending = iterator.next();
    const rejection = expect(pending).rejects.toThrow('stop');
    await vi.advanceTimersByTimeAsync(0);
    controller.abort(new Error('stop'));
    await rejection;
    expect(closed).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    await iterator.return?.();
    vi.useRealTimers();
  }
});
