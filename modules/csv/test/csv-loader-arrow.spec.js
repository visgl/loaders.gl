import test from 'tape-promise/tape';
import {loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {ArrowTableBatch} from '@loaders.gl/arrow';
import {RecordBatch} from 'apache-arrow';
// import {Schema, Field, RecordBatch, Float32Vector} from 'apache-arrow';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';

test('CSVLoader#loadInBatches(numbers-100.csv, arrow)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    csv: {
      TableBatch: ArrowTableBatch,
      batchSize: 40
    }
  });

  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch instanceof RecordBatch, 'returns arrow RecordBatch');
    t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 3, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(numbers-10000.csv, arrow)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVLoader, {
    csv: {
      TableBatch: ArrowTableBatch,
      batchSize: 2000
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch instanceof RecordBatch, 'returns arrow RecordBatch');
    t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});
