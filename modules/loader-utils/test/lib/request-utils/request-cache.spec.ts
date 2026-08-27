// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RequestCache, RangeRequestCache} from '@loaders.gl/loader-utils';
import {expect, test, vi} from 'vitest';

test('RequestCache shares concurrent loads and retains settled values', async () => {
  const cache = new RequestCache<number>();
  const load = vi.fn(async () => 42);

  const [first, second] = await Promise.all([
    cache.getOrLoad('answer', load),
    cache.getOrLoad('answer', load)
  ]);
  const third = await cache.get('answer');

  expect([first, second, third]).toEqual([42, 42, 42]);
  expect(load).toHaveBeenCalledOnce();
  expect(cache.size).toBe(1);
  expect(cache.pendingSize).toBe(0);
});

test('RequestCache evicts settled entries in LRU order by count', async () => {
  const cache = new RequestCache<number>({maxEntries: 2});
  cache.set('first', 1);
  cache.set('second', 2);
  await cache.get('first');
  cache.set('third', 3);

  expect(await cache.get('first')).toBe(1);
  expect(cache.get('second')).toBeUndefined();
  expect(await cache.get('third')).toBe(3);
});

test('RequestCache observes byte limits without evicting pending requests', async () => {
  let resolvePending: ((value: Uint8Array) => void) | undefined;
  const cache = new RequestCache<Uint8Array>({
    maxBytes: 4,
    getByteLength: value => value.byteLength
  });
  const pending = cache.getOrLoad(
    'pending',
    () =>
      new Promise(resolve => {
        resolvePending = resolve;
      })
  );
  cache.set('settled', new Uint8Array([1, 2, 3, 4]));

  expect(cache.pendingSize).toBe(1);
  await Promise.resolve();
  resolvePending?.(new Uint8Array([5, 6, 7, 8]));
  await pending;

  expect(cache.pendingSize).toBe(0);
  expect(cache.byteLength).toBe(4);
  expect(cache.get('pending')).toBeUndefined();
  expect(await cache.get('settled')).toEqual(new Uint8Array([1, 2, 3, 4]));
});

test('RequestCache isolates caller aborts and aborts transport after the last waiter', async () => {
  const firstController = new AbortController();
  const secondController = new AbortController();
  let transportSignal: AbortSignal | undefined;
  const cache = new RequestCache<number>();
  const load = (signal: AbortSignal): Promise<number> => {
    transportSignal = signal;
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), {once: true});
    });
  };

  const first = cache.getOrLoad('shared', load, firstController.signal);
  const second = cache.getOrLoad('shared', load, secondController.signal);
  firstController.abort();

  await expect(first).rejects.toMatchObject({name: 'AbortError'});
  expect(transportSignal?.aborted).toBe(false);

  secondController.abort();
  await expect(second).rejects.toMatchObject({name: 'AbortError'});
  expect(transportSignal?.aborted).toBe(true);
  expect(cache.size).toBe(0);
});

test('RequestCache removes failed requests so callers can retry', async () => {
  const cache = new RequestCache<number>();
  await expect(
    cache.getOrLoad('retry', async () => {
      throw new Error('failed');
    })
  ).rejects.toThrow('failed');

  await expect(cache.getOrLoad('retry', async () => 7)).resolves.toBe(7);
});

test('RequestCache reports removal reasons and aborts pending work when cleared', async () => {
  const removals: Array<[string, string]> = [];
  const cache = new RequestCache<number>({
    onRemove: (key, reason) => removals.push([key, reason])
  });
  cache.set('replace', 1);
  cache.set('replace', 2);
  cache.set('delete', 3);
  cache.delete('delete');
  const pending = cache.getOrLoad(
    'pending',
    signal =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('transport aborted')), {
          once: true
        });
      })
  );

  cache.clear();

  await expect(pending).rejects.toThrow('transport aborted');
  expect(removals).toEqual([
    ['replace', 'replace'],
    ['delete', 'delete'],
    ['replace', 'clear'],
    ['pending', 'clear']
  ]);
  expect(cache.size).toBe(0);
});

test('RequestCache validates limits and ignores invalid asynchronous size estimates', async () => {
  expect(() => new RequestCache({maxEntries: -1})).toThrow('maxEntries');
  const cache = new RequestCache<number>({getByteLength: () => Number.POSITIVE_INFINITY});

  await expect(cache.getOrLoad('value', async () => 1)).resolves.toBe(1);
  await Promise.resolve();

  expect(cache.size).toBe(0);
});

test('RangeRequestCache serves contained immutable range copies', async () => {
  const events: string[] = [];
  const cache = new RangeRequestCache({onEvent: event => events.push(event.type)});
  cache.set('source', 10, new Uint8Array([10, 11, 12, 13, 14, 15]).buffer);

  const first = await cache.get('source', 12, 3);
  expect(Array.from(new Uint8Array(first!))).toEqual([12, 13, 14]);
  new Uint8Array(first!)[0] = 255;
  const second = await cache.get('source', 12, 3);

  expect(Array.from(new Uint8Array(second!))).toEqual([12, 13, 14]);
  expect(events).toEqual(['store', 'hit', 'hit']);
});

test('RangeRequestCache shares exact loads and isolates source identities', async () => {
  const cache = new RangeRequestCache();
  const fetchRange = vi.fn(
    async (offset: number, length: number) =>
      new Uint8Array(length).map((_, index) => offset + index).buffer
  );

  const [first, second] = await Promise.all([
    cache.read({sourceId: 'first', offset: 4, length: 3, fetchRange}),
    cache.read({sourceId: 'first', offset: 4, length: 3, fetchRange})
  ]);
  await cache.read({sourceId: 'second', offset: 4, length: 3, fetchRange});

  expect(Array.from(new Uint8Array(first))).toEqual([4, 5, 6]);
  expect(Array.from(new Uint8Array(second))).toEqual([4, 5, 6]);
  expect(fetchRange).toHaveBeenCalledTimes(2);
});

test('RangeRequestCache evicts ranges using a byte budget', async () => {
  const cache = new RangeRequestCache({maxBytes: 4});
  cache.set('source', 0, new Uint8Array([0, 1, 2, 3]).buffer);
  cache.set('source', 4, new Uint8Array([4, 5, 6, 7]).buffer);

  expect(await cache.get('source', 0, 1)).toBeUndefined();
  expect(Array.from(new Uint8Array((await cache.get('source', 4, 4))!))).toEqual([4, 5, 6, 7]);
  expect(cache.byteLength).toBe(4);
});

test('RangeRequestCache bypasses storage and copies for oversized ranges', async () => {
  const cache = new RangeRequestCache({maxBytes: 2});
  const source = new Uint8Array([0, 1, 2, 3]).buffer;
  const result = await cache.read({
    sourceId: 'source',
    offset: 0,
    length: 4,
    fetchRange: async () => source
  });

  expect(result).toBe(source);
  expect(cache.size).toBe(0);
  expect(cache.byteLength).toBe(0);
});

test('RangeRequestCache deletes source ranges and reports evictions', async () => {
  const events: string[] = [];
  const cache = new RangeRequestCache({
    maxEntries: 1,
    onEvent: event => events.push(`${event.type}:${event.sourceId}:${event.offset}`)
  });
  cache.set('first', 0, new Uint8Array([1]).buffer);
  cache.set('second', 0, new Uint8Array([2]).buffer);

  expect(events).toContain('evict:first:0');
  cache.deleteSource('second');
  expect(await cache.get('second', 0, 1)).toBeUndefined();
  expect(cache.size).toBe(0);
});

test('RangeRequestCache rejects malformed ranges and short responses', async () => {
  const cache = new RangeRequestCache();
  await expect(
    cache.read({
      sourceId: 'source',
      offset: 0,
      length: 2,
      fetchRange: async () => new Uint8Array([1]).buffer
    })
  ).rejects.toThrow('expected 2');
  expect(cache.size).toBe(0);
  expect(() => cache.set('source', -1, new ArrayBuffer(0))).toThrow('non-negative safe integers');
});
