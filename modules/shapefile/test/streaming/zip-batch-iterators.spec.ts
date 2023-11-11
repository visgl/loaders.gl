// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {ObjectRowTableBatch, ArrayRowTableBatch} from '@loaders.gl/schema';
import {_zipBatchIterators as zipBatchIterators} from '@loaders.gl/shapefile';

type RowTableBatch = ObjectRowTableBatch | ArrayRowTableBatch;

type TestCase = {
  title: string;
  iterator1: Iterator<RowTableBatch>;
  iterator2: Iterator<RowTableBatch>;
  shape: 'object-row-table' | 'array-row-table';
  result: RowTableBatch[];
};

const TEST_CASES: TestCase[] = [
  {
    title: 'empty iterators',
    iterator1: [][Symbol.iterator](),
    iterator2: [][Symbol.iterator](),
    shape: 'object-row-table',
    result: []
  }
  // TODO - add some non-trivial cases
];

test('zipBatchIterators', async (t) => {
  for (const tc of TEST_CASES) {
    const zippedIterator = zipBatchIterators(tc.iterator1, tc.iterator2, tc.shape);
    const batches: RowTableBatch[] = [];
    for await (const batch of zippedIterator) {
      batches.push(batch);
    }
    t.deepEquals(batches, tc.result, tc.title);
  }
  t.end();
});
