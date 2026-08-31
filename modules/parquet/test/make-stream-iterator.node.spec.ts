// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Readable} from 'stream';
import {expect, test, vi} from 'vitest';
import {makeStreamIterator} from '../src/lib/utils/make-stream-iterator';

/** Collects an asynchronous stream adapter into an array. */
async function collect<T>(values: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of values) result.push(value);
  return result;
}

/** Creates a minimal Node-style async iterable with an observable return hook. */
function createNodeStream<T>(results: IteratorResult<T>[], returnError?: Error): Readable {
  const iterator = {
    next: vi.fn(async () => results.shift() || ({done: true, value: undefined} as IteratorResult<T>)),
    return: vi.fn(async () => {
      if (returnError) throw returnError;
      return {done: true, value: undefined} as IteratorResult<T>;
    })
  };
  return {
    [Symbol.asyncIterator]: () => iterator,
    iterator
  } as unknown as Readable;
}

test('Node stream adapter yields values and finishes without cancellation', async () => {
  const stream = createNodeStream<number>([
    {done: false, value: 1},
    {done: false, value: 2},
    {done: true, value: undefined as never}
  ]) as Readable & {iterator: {return: ReturnType<typeof vi.fn>}};
  await expect(collect(makeStreamIterator(stream))).resolves.toEqual([1, 2]);
  expect(stream.iterator.return).not.toHaveBeenCalled();
});

test('Node stream adapter invokes return when its consumer stops early', async () => {
  const stream = createNodeStream<number>([{done: false, value: 1}]) as Readable & {
    iterator: {return: ReturnType<typeof vi.fn>};
  };
  for await (const value of makeStreamIterator(stream)) {
    expect(value).toBe(1);
    break;
  }
  expect(stream.iterator.return).toHaveBeenCalledOnce();
});

test('Node stream adapter reports cleanup failures after an early stop', async () => {
  const error = new Error('return failed');
  const stream = createNodeStream([{done: false, value: 1}], error);
  const consumeOne = async () => {
    for await (const _value of makeStreamIterator(stream)) break;
  };
  await expect(consumeOne()).rejects.toThrow(error);
});

test('Node stream adapter preserves iteration failures over cleanup failures', async () => {
  const readError = new Error('read failed');
  const returnError = new Error('return failed');
  const iterator = {
    next: vi.fn(async () => {
      throw readError;
    }),
    return: vi.fn(async () => {
      throw returnError;
    })
  };
  const stream = {[Symbol.asyncIterator]: () => iterator} as unknown as Readable;
  await expect(collect(makeStreamIterator(stream))).rejects.toThrow(readError);
  expect(iterator.return).toHaveBeenCalledOnce();
});

test('Node stream adapter aborts pending reads and invokes return', async () => {
  const abortController = new AbortController();
  let settleRead!: (value: IteratorResult<number>) => void;
  const iterator = {
    next: vi.fn(() => new Promise<IteratorResult<number>>(resolve => (settleRead = resolve))),
    return: vi.fn(async () => ({done: true, value: undefined as never}))
  };
  const stream = {[Symbol.asyncIterator]: () => iterator} as unknown as Readable;
  const result = collect(makeStreamIterator(stream, {signal: abortController.signal}));
  abortController.abort(new Error('stop now'));
  await expect(result).rejects.toThrow('stop now');
  expect(iterator.return).toHaveBeenCalledOnce();
  settleRead({done: true, value: undefined as never});
});
