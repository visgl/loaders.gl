// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {AsyncQueue} from '@loaders.gl/schema-utils';

test('Enqueue before dequeue', async () => {
  const queue = new AsyncQueue();
  queue.enqueue('a');
  queue.enqueue('b');
  queue.close();
  expect(await takeAsync(queue)).toEqual(['a', 'b']);
});

test('Dequeue before enqueue', async () => {
  const queue = new AsyncQueue();
  const promise = Promise.all([queue.next(), queue.next()]);

  queue.enqueue('a');
  queue.enqueue('b');
  queue.close();

  const array = await promise;
  const values = array.map(x => x.value);
  expect(values).toEqual(['a', 'b']);
});

test('rejects values after close and resolves pending reads', async () => {
  const queue = new AsyncQueue<string>();
  const pendingRead = queue.next();

  queue.close();

  expect(await pendingRead).toEqual({done: true});
  expect(() => queue.enqueue('after close')).toThrow('Closed');
  expect(await queue.next()).toEqual({done: true});
});

test('propagates errors to a pending read', async () => {
  const queue = new AsyncQueue<string>();
  const pendingRead = queue.next();
  const error = new Error('bad value');

  queue.enqueue(error);

  await expect(pendingRead).rejects.toThrow('bad value');
});

/**
 * @returns a Promise for an Array with the elements
 * in `asyncIterable`
 */
async function takeAsync(asyncIterable: AsyncIterable<unknown>, count = Infinity) {
  const result: unknown[] = [];
  const iterator = asyncIterable[Symbol.asyncIterator]();
  while (result.length < count) {
    const {value, done} = await iterator.next();
    if (done) {
      break;
    }
    result.push(value);
  }
  return result;
}
