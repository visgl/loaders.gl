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
