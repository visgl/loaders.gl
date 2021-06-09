import test from 'tape-promise/tape';

import {parseInBatches} from '@loaders.gl/core';

const NoOpLoader = {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseInBatches: (iterator, options) => iterator
};

test('parseInBatches', async (t) => {
  // @ts-ignore
  let batches = await parseInBatches([1, 1], NoOpLoader);

  let metadata = false;
  for await (const batch of batches) {
    if (batch.batchType === 'metadata') {
      metadata = true;
    }
    t.deepEquals(batch, 1, 'parseInBatches returned data');
  }
  t.notOk(metadata, 'metadata batch was generated');

  // @ts-ignore
  batches = await parseInBatches([1, 2], NoOpLoader, {metadata: true});

  const values = [];
  metadata = false;
  for await (const batch of batches) {
    if (batch.batchType === 'metadata') {
      metadata = true;
    } else {
      values.push(batch);
    }
  }
  t.deepEquals(values, [1, 2], 'parseInBatches returned data');
  t.ok(metadata, 'metadata batch was generated');

  t.end();
});
