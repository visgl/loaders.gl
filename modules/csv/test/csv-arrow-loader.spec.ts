// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {CSVArrowLoader} from '@loaders.gl/csv';
import * as arrow from 'apache-arrow';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';
const CSV_INCIDENTS_URL_QUOTES = '@loaders.gl/csv/test/data/sf_incidents-small.csv';

test('CSVArrowLoader#loadInBatches(numbers-100.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVArrowLoader, {
    batchSize: 40
  });

  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 3, 'Correct number of batches received');

  t.end();
});

test('CSVArrowLoader#loadInBatches(numbers-10000.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVArrowLoader, {
    batchSize: 2000
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});

test('CSVArrowLoader#loadInBatches(incidents.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVArrowLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});
