import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {ColumnarTableBatch} from '@loaders.gl/experimental';
import {CSVLoader} from '@loaders.gl/csv';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
// const CSV_SAMLE_LONG_URL = '@loaders.gl/csv/test/data/sample-long.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';

test('CSVLoader#load', async t => {
  const rows = await load(CSV_SAMPLE_URL, CSVLoader);
  t.is(rows.length, 2, 'Got correct table size');
  t.deepEqual(rows[0], ['A', 'B', 1], 'Got correct first row');

  const rows2 = await load(CSV_SAMPLE_VERY_LONG_URL, CSVLoader);
  t.is(rows2.length, 2000, 'Got correct table size');
  t.deepEqual(
    rows2[0],
    {
      TLD: 'ABC',
      'meaning of life': 42,
      placeholder: 'Lorem ipsum dolor sit'
    },
    'Got correct first row'
  );

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, columns)', async t => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    TableBatch: ColumnarTableBatch
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');
  t.end();
});

test('CSVLoader#loadInBatches(sample-very-long.csv, columns)', async t => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    TableBatch: ColumnarTableBatch,
    batchSize
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, batchSize, 'Got correct batch size');
    batchCount++;
    if (batchCount === 5) {
      break;
    }
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, rows)', async t => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample-very-long.csv, rows)', async t => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {batchSize});
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, batchSize, 'Got correct batch size');
    batchCount++;
    if (batchCount === 5) {
      break;
    }
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});
