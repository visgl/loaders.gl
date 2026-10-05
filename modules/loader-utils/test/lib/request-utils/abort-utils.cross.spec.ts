// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {waitForPromiseWithSignal, waitForPromiseWithSignals} from '../../../src';

test('cancellation preserves reasons and leaves other subscribers active', async () => {
  let complete!: (value: number) => void;
  const work = new Promise<number>(resolve => {
    complete = resolve;
  });
  const first = new AbortController();
  const second = new AbortController();
  const canceled = waitForPromiseWithSignal(work, first.signal);
  const retained = waitForPromiseWithSignal(work, second.signal);
  const reason = new Error('obsolete');
  first.abort(reason);
  await expect(canceled).rejects.toBe(reason);
  complete(42);
  expect(await retained).toBe(42);
});

test('obsolete work failures remain observed even when cancellation precedes waiting', async () => {
  const controller = new AbortController();
  controller.abort('caller reason');
  const canceled = waitForPromiseWithSignal(
    Promise.reject(new Error('late failure')),
    controller.signal
  );
  await expect(canceled).rejects.toBe('caller reason');
});

test('composed work releases parent listeners and never starts for an aborted parent', async () => {
  const caller = new AbortController();
  const owner = new AbortController();
  const removeCallerListener = vi.spyOn(caller.signal, 'removeEventListener');
  const removeOwnerListener = vi.spyOn(owner.signal, 'removeEventListener');
  const retained = waitForPromiseWithSignals(
    async signal => {
      expect(signal).not.toBe(caller.signal);
      return 42;
    },
    [caller.signal, undefined, owner.signal]
  );
  expect(await retained).toBe(42);
  expect(removeCallerListener).toHaveBeenCalledOnce();
  expect(removeOwnerListener).toHaveBeenCalledOnce();
  const reason = new Error('source finalized');
  const pending = waitForPromiseWithSignals(
    () => new Promise(() => {}),
    [caller.signal, owner.signal]
  );
  owner.abort(reason);
  await expect(pending).rejects.toBe(reason);
  const operation = vi.fn(async () => 1);
  await expect(waitForPromiseWithSignals(operation, [owner.signal])).rejects.toBe(reason);
  expect(operation).not.toHaveBeenCalled();
  removeCallerListener.mockRestore();
  removeOwnerListener.mockRestore();
});

test('failed composed work cancels its owned siblings without aborting the caller', async () => {
  const caller = new AbortController();
  const failure = new Error('decode failed');
  let childSignal: AbortSignal | undefined;
  await expect(
    waitForPromiseWithSignals(
      async signal => {
        childSignal = signal;
        throw failure;
      },
      [caller.signal]
    )
  ).rejects.toBe(failure);
  expect(childSignal?.aborted).toBe(true);
  expect(childSignal?.reason).toBe(failure);
  expect(caller.signal.aborted).toBe(false);
  const operation = vi.fn(() => {
    throw failure;
  });
  await expect(waitForPromiseWithSignals(operation, [caller.signal])).rejects.toBe(failure);
});
