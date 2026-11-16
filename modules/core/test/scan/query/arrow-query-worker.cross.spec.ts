// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {
  createArrowQueryWorker,
  parseSQLPredicate,
  queryArrowTableInWorker
} from '@loaders.gl/core/scan';

const worker =
  typeof Worker === 'undefined'
    ? {url: new URL('../../../dist/scan/arrow-query-worker-entry.js', import.meta.url)}
    : {
        create: () =>
          new Worker(new URL('../../../src/scan/arrow-query-worker-entry.ts', import.meta.url), {
            type: 'module'
          })
      };

test('retains projected buffers, returns a snapshot, and transfers the source back', async () => {
  const data = tableFromArrays({id: new Int32Array([1, 2, 3]), name: ['a', 'b', 'c']});
  const inputBuffer = data.getChild('id')!.data[0].values.buffer;
  const session = await createArrowQueryWorker(
    {shape: 'arrow-table', data},
    {worker, inputOwnership: 'transfer'}
  );

  try {
    expect(inputBuffer.byteLength).toBe(0);
    const projected = await session.query({columns: ['id'], limit: 1});
    expect(Array.from(projected.data.getChild('id')!)).toEqual([1]);
    const snapshot = await session.getTable();
    expect(Array.from(snapshot.data.getChild('name')!)).toEqual(['a', 'b', 'c']);
    const filtered = await session.query({predicate: parseSQLPredicate('id >= 2')});
    expect(Array.from(filtered.data.getChild('id')!)).toEqual([2, 3]);
    const returned = await session.takeTable();
    expect(Array.from(returned.data.getChild('id')!)).toEqual([1, 2, 3]);
    await expect(session.query()).rejects.toThrow('closed');
  } finally {
    await session.close();
  }
});

test('queries a named child table and preserves host input by default', async () => {
  const data = tableFromArrays({id: new Int32Array([1, 2])});
  const child = tableFromArrays({id: new Int32Array([3])});
  const result = await queryArrowTableInWorker(
    {shape: 'arrow-table', data},
    {union: [{source: 'child'}], tables: {child: {shape: 'arrow-table', data: child}}},
    {worker}
  );
  expect(Array.from(result.data.getChild('id')!)).toEqual([1, 2, 3]);
  expect(Array.from(data.getChild('id')!)).toEqual([1, 2]);
  expect(Array.from(child.getChild('id')!)).toEqual([3]);
});
