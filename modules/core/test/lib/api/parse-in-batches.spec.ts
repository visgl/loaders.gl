// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parseInBatches} from '@loaders.gl/core';
const NoOpLoader = {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseInBatches: (iterator, options) => iterator
};
test('parseInBatches', async () => {
  // @ts-ignore
  let batches = await parseInBatches([1, 1], NoOpLoader);
  let metadata = false;
  for await (const batch of batches) {
    if (batch.batchType === 'metadata') {
      metadata = true;
    }
    expect(batch, 'parseInBatches returned data').toEqual(1);
  }
  expect(metadata, 'metadata batch was generated').toBeFalsy();
  // @ts-ignore
  batches = await parseInBatches([1, 2], NoOpLoader, {core: {metadata: true}});
  const values: unknown[] = [];
  metadata = false;
  for await (const batch of batches) {
    if (batch.batchType === 'metadata') {
      metadata = true;
    } else {
      values.push(batch);
    }
  }
  expect(values, 'parseInBatches returned data').toEqual([1, 2]);
  expect(metadata, 'metadata batch was generated').toBeTruthy();
});

test('parseInBatches wraps table-shaped fallback output in a data batch', async () => {
  const tableLoader = {
    id: 'test-table',
    name: 'Test Table',
    module: 'core',
    version: '1.0.0',
    mimeTypes: ['application/x-test-table'],
    extensions: ['table'],
    parse: async () => ({shape: 'object-row-table', data: [{value: 1}, {value: 2}]})
  };

  const batches = await parseInBatches(new Uint8Array([1]), tableLoader as any);
  expect(await Array.fromAsync(batches)).toEqual([
    {
      shape: 'object-row-table',
      data: [{value: 1}, {value: 2}],
      length: 2,
      batchType: 'data',
      mimeType: 'application/x-test-table'
    }
  ]);
});

test('parseInBatches paces tagged spans and delivers related trace tables immediately', async () => {
  const loader = {
    id: 'test-trace',
    name: 'Test Trace',
    module: 'traces',
    version: '1.0.0',
    mimeTypes: ['application/x-test-trace'],
    extensions: ['trace'],
    async *parseInBatches() {
      yield {table: 'resources', data: {numRows: 100}};
      yield {table: 'spans', data: {numRows: 5}};
      yield {table: 'events', data: {numRows: 100}};
      yield {table: 'spans', data: {numRows: 5}};
    }
  };
  const batches = await parseInBatches(new Uint8Array([1]), loader as any, {
    core: {batchMaxRowsPerSecond: 10}
  });
  const iterator = batches[Symbol.asyncIterator]();
  vi.useFakeTimers({toFake: ['performance', 'setTimeout', 'clearTimeout']});
  try {
    expect((await iterator.next()).value.table).toBe('resources');
    expect((await iterator.next()).value.table).toBe('spans');
    expect((await iterator.next()).value.table).toBe('events');
    const delivered = vi.fn();
    const pending = iterator.next().then(delivered);
    await vi.advanceTimersByTimeAsync(499);
    expect(delivered).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(delivered).toHaveBeenCalledWith({
      done: false,
      value: {table: 'spans', data: {numRows: 5}}
    });
    expect((await iterator.next()).done).toBe(true);
  } finally {
    await iterator.return?.();
    vi.useRealTimers();
  }
});
