// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
  batches = await parseInBatches([1, 2], NoOpLoader, {metadata: true});
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
