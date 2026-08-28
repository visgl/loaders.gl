import {expect, test} from 'vitest';
import {AsyncQueue} from '@loaders.gl/worker-utils';
test('AsyncQueue#push', async () => {
  expect.assertions(2);
  const asyncQueue = new AsyncQueue();
  async function iterate() {
    for await (const value of asyncQueue) {
      expect(value).toBe('tick');
    }
  }
  const promise = iterate();
  asyncQueue.push('tick');
  asyncQueue.push('tick');
  asyncQueue.close();
  await promise;
});
test('AsyncQueue#error', async () => {
  expect.assertions(2);
  const asyncQueue = new AsyncQueue();
  async function iterate() {
    for await (const value of asyncQueue) {
      expect(value).toBe('tick');
    }
  }
  const promise = iterate();
  asyncQueue.enqueue('tick');
  asyncQueue.enqueue(new Error('done'));
  await expect(promise).rejects.toBeDefined();
});
