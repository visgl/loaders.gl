import {expect, test} from 'vitest';

import {
  advanceTimersAndFlush,
  createDeferred,
  flushMicrotasks,
  waitForCondition,
  withFakeTimers
} from '@loaders.gl/test-utils/vitest';

test('vitest async utils#createDeferred', async () => {
  const deferred = createDeferred<number>();
  deferred.resolve(7);
  await expect(deferred.promise).resolves.toBe(7);
});

test('vitest async utils#flushMicrotasks', async () => {
  let value = 0;

  Promise.resolve().then(() => {
    value = 1;
  });

  await flushMicrotasks();
  expect(value).toBe(1);
});

test('vitest async utils#waitForCondition resolves', async () => {
  let ready = false;
  setTimeout(() => {
    ready = true;
  }, 0);

  await waitForCondition(() => ready, {timeoutMs: 100, intervalMs: 1});
  expect(ready).toBe(true);
});

test('vitest async utils#waitForCondition rejects with custom message', async () => {
  await expect(
    waitForCondition(() => false, {timeoutMs: 10, intervalMs: 1, message: 'expected timeout'})
  ).rejects.toThrow('expected timeout');
});

test('vitest async utils#advanceTimersAndFlush', async () => {
  await withFakeTimers(async () => {
    let value = 0;

    setTimeout(() => {
      Promise.resolve().then(() => {
        value = 1;
      });
    }, 10);

    await advanceTimersAndFlush(10);
    expect(value).toBe(1);
  });
});

test('vitest async utils#withFakeTimers restores timers after failure', async () => {
  await expect(
    withFakeTimers(async () => {
      throw new Error('expected failure');
    })
  ).rejects.toThrow('expected failure');

  await expect(
    new Promise<string>(resolve => {
      setTimeout(() => resolve('real timer'), 0);
    })
  ).resolves.toBe('real timer');
});
