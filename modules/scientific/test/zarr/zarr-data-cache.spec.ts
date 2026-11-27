// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {cloneZarrSelection, getCachedZarrSelection} from '../../src/zarr/lib/zarr-data-cache';

test('Zarr selection cache shares requests and evicts failures', async () => {
  const array = {};
  let reads = 0;
  const read = async () => {
    reads++;
    return {data: new Uint8Array([reads]), shape: [1]};
  };

  const first = getCachedZarrSelection(array, 'selection', read);
  const second = getCachedZarrSelection(array, 'selection', read);
  expect(first).toBe(second);
  expect(Array.from((await first).data)).toEqual([1]);
  expect(reads).toBe(1);

  let failedReads = 0;
  const failingRead = async () => {
    failedReads++;
    if (failedReads === 1) throw new Error('expected failure');
    return {data: new Uint8Array([2]), shape: [1]};
  };
  await expect(getCachedZarrSelection(array, 'failure', failingRead)).rejects.toThrow(
    'expected failure'
  );
  await getCachedZarrSelection(array, 'failure', failingRead);
  expect(failedReads).toBe(2);
});

test('Zarr selection cache isolates waiter cancellation and returned buffers', async () => {
  const array = {};
  let resolveRead!: (value: {data: Uint8Array; shape: number[]}) => void;
  const read = () =>
    new Promise<{data: Uint8Array; shape: number[]}>(resolve => {
      resolveRead = resolve;
    });
  const controller = new AbortController();
  const cancelled = getCachedZarrSelection(array, 'abort', read, controller.signal);
  const active = getCachedZarrSelection(array, 'abort', read);
  controller.abort();
  await expect(cancelled).rejects.toBeDefined();
  resolveRead({data: new Uint8Array([7]), shape: [1]});
  const cached = await active;
  const copy = cloneZarrSelection(cached);
  copy.data[0] = 9;
  expect(Array.from(cached.data)).toEqual([7]);
});

test('Zarr selection cache evicts least-recently-used entries and propagates failures with signals', async () => {
  const array = {};
  let reads = 0;
  const read = async () => ({data: new Uint16Array([++reads]), shape: [1]});
  await getCachedZarrSelection(array, 'keep', read);
  await getCachedZarrSelection(array, 'evict', read);
  for (let index = 0; index < 1022; index++)
    await getCachedZarrSelection(array, String(index), read);
  await getCachedZarrSelection(array, 'keep', read);
  await getCachedZarrSelection(array, 'new', read);
  expect((await getCachedZarrSelection(array, 'keep', read)).data[0]).toBe(1);
  expect((await getCachedZarrSelection(array, 'evict', read)).data[0]).toBe(1026);
  const controller = new AbortController();
  await expect(
    getCachedZarrSelection(
      array,
      'failure',
      async () => {
        throw new Error('failed');
      },
      controller.signal
    )
  ).rejects.toThrow('failed');
  controller.abort(new Error('cancelled'));
  await expect(getCachedZarrSelection(array, 'keep', read, controller.signal)).rejects.toThrow(
    'cancelled'
  );
});

test('Zarr selection cache evicts by decoded bytes and skips oversized selections', async () => {
  const array = {};
  const limit = 128 * 1024 * 1024;
  let reads = 0;
  /** Simulates large decoded sizes without allocating large test buffers. */
  const read = async (byteLength: number) => {
    const data = new Uint8Array([++reads]);
    Object.defineProperty(data, 'byteLength', {value: byteLength});
    return {data, shape: [1]};
  };
  const readHalfBudget = () => read(limit / 2);
  const first = await getCachedZarrSelection(array, 'first', readHalfBudget);
  const second = await getCachedZarrSelection(array, 'second', readHalfBudget);
  await getCachedZarrSelection(array, 'first', readHalfBudget);
  await getCachedZarrSelection(array, 'third', readHalfBudget);
  await getCachedZarrSelection(array, 'oversized', () => read(limit + 1));
  expect(await getCachedZarrSelection(array, 'first', readHalfBudget)).toBe(first);
  expect(await getCachedZarrSelection(array, 'second', readHalfBudget)).not.toBe(second);
  expect((await getCachedZarrSelection(array, 'oversized', () => read(limit + 1))).data[0]).toBe(6);
});
