// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {cloneZarrSelection, getCachedZarrSelection} from '../src/lib/zarr-data-cache';

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
  await expect(getCachedZarrSelection(array, 'failure', failingRead)).rejects.toThrow('expected failure');
  await getCachedZarrSelection(array, 'failure', failingRead);
  expect(failedReads).toBe(2);
});

test('Zarr selection cache isolates waiter cancellation and returned buffers', async () => {
  const array = {};
  let resolveRead!: (value: {data: Uint8Array; shape: number[]}) => void;
  const read = () => new Promise<{data: Uint8Array; shape: number[]}>(resolve => {
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
