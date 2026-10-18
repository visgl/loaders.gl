import {expect, test} from 'vitest';
import {AsyncQueue} from '@loaders.gl/core/worker-utils';
test('AsyncQueue#push', async () => {
  const asyncQueue = new AsyncQueue();
  const values: unknown[] = [];
  async function iterate() {
    for await (const value of asyncQueue) {
      values.push(value);
    }
  }
  const promise = iterate();
  asyncQueue.push('tick');
  asyncQueue.push('tick');
  asyncQueue.close();
  await promise;
  expect(values).toEqual(['tick', 'tick']);
});
test('AsyncQueue#error', async () => {
  const asyncQueue = new AsyncQueue();
  const values: unknown[] = [];
  async function iterate() {
    for await (const value of asyncQueue) {
      values.push(value);
    }
  }
  const promise = iterate();
  asyncQueue.enqueue('tick');
  asyncQueue.enqueue(new Error('done'));
  await expect(promise).rejects.toBeDefined();
  expect(values).toEqual(['tick']);
});
