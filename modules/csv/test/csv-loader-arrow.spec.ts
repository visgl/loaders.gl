import test from 'tape-promise/tape';
import {loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {CSVLoader} from '../src/csv-loader'; // from '@loaders.gl/csv';
import * as arrow from 'apache-arrow';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';

// TODO -restore
test.skip('CSVLoader#loadInBatches(numbers-100.csv, arrow)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    csv: {
      shape: 'arrow-table'
    },
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

// TODO - restore
test.skip('CSVLoader#loadInBatches(numbers-10000.csv, arrow)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVLoader, {
    csv: {
      shape: 'arrow-table'
    },
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
