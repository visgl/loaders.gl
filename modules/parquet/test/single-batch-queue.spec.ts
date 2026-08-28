import {describe, expect, test} from 'vitest';
import {SingleBatchQueue} from '../src/lib/sources/single-batch-queue';

describe('SingleBatchQueue', () => {
  test('preserves order and applies one-value producer backpressure', async () => {
    const queue = new SingleBatchQueue<number>();
    const controller = new AbortController();
    let firstPushFinished = false;
    /** Produces batches while respecting the queue's single-producer contract. */
    const producer = async (): Promise<void> => {
      await queue.push(1, controller.signal);
      firstPushFinished = true;
      await queue.push(2, controller.signal);
      queue.finish();
    };
    const production = producer();

    await Promise.resolve();
    expect(firstPushFinished).toBe(false);

    const iterator = queue[Symbol.asyncIterator]();
    await expect(iterator.next()).resolves.toEqual({value: 1, done: false});
    await Promise.resolve();
    expect(firstPushFinished).toBe(true);
    await expect(iterator.next()).resolves.toEqual({value: 2, done: false});
    await production;
    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});
  });

  test('wakes a waiting consumer when data arrives', async () => {
    const queue = new SingleBatchQueue<string>();
    const iterator = queue[Symbol.asyncIterator]();
    const nextValue = iterator.next();
    const push = queue.push('ready', new AbortController().signal);

    await expect(nextValue).resolves.toEqual({value: 'ready', done: false});
    await push;
    queue.finish();
  });

  test('propagates producer failures to a waiting consumer', async () => {
    const queue = new SingleBatchQueue<number>();
    const iterator = queue[Symbol.asyncIterator]();
    const nextValue = iterator.next();
    const failure = new Error('producer failed');

    queue.fail(failure);
    await expect(nextValue).rejects.toBe(failure);
  });

  test('rejects pushes aborted before and during backpressure', async () => {
    const queue = new SingleBatchQueue<number>();
    const alreadyAborted = new AbortController();
    alreadyAborted.abort(new Error('already aborted'));
    await expect(queue.push(1, alreadyAborted.signal)).rejects.toThrow('already aborted');

    const controller = new AbortController();
    const blockedPush = queue.push(1, controller.signal);
    controller.abort(new Error('cancelled while waiting'));

    await expect(blockedPush).rejects.toThrow('cancelled while waiting');
  });
});
