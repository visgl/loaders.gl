import test from 'tape-promise/tape';
import {AsyncQueue} from '@loaders.gl/worker-utils';

test('AsyncQueue#push', async (t) => {
  t.plan(2);

  const asyncQueue = new AsyncQueue();

  async function iterate() {
    for await (const value of asyncQueue) {
      t.equal(value, 'tick');
    }
  }

  const promise = iterate();

  asyncQueue.push('tick');
  asyncQueue.push('tick');
  asyncQueue.close();

  await promise;

  // t.end(); handled by t.plan()
});

test('AsyncQueue#error', async (t) => {
  t.plan(2);

  const asyncQueue = new AsyncQueue();

  async function iterate() {
    for await (const value of asyncQueue) {
      t.equal(value, 'tick');
    }
  }

  const promise = iterate();

  asyncQueue.enqueue('tick');
  asyncQueue.enqueue(new Error('done'));

  t.rejects(promise);

  // t.end(); handled by t.plan()
});
