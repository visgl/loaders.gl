import test from 'tape-promise/tape';
import {loadFileInBatches, isIterator, isAsyncIterable,  ColumnarTableBatch} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
// const CSV_SAMLE_LONG_URL = '@loaders.gl/csv/test/data/sample-long.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';

test('CSVLoader#loadFileInBatches(sample.csv, columns)', async t => {
  const iterator = await loadFileInBatches(CSV_SAMPLE_URL, CSVLoader, {
    TableBatch: ColumnarTableBatch
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadFileInBatches returned iterator');

  let i = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    if (++i > 5) {
      break;
    }
  }

  t.end();
});

test('CSVLoader#loadFileInBatches(sample-very-long.csv, columns)', async t => {
  const iterator = await loadFileInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    TableBatch: ColumnarTableBatch,
    batchSize: 25
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadFileInBatches returned iterator');

  let i = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    if (++i > 5) {
      break;
    }
  }

  t.end();
});

test('CSVLoader#loadFileInBatches(sample.csv, rows)', async t => {
  const iterator = await loadFileInBatches(CSV_SAMPLE_URL, CSVLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadFileInBatches returned iterator');

  let i = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    if (++i > 5) {
      break;
    }
  }

  t.end();
});

test('CSVLoader#loadFileInBatches(sample-very-long.csv, rows)', async t => {
  const iterator = await loadFileInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {batchSize: 25});
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadFileInBatches returned iterator');

  let i = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    if (++i > 5) {
      break;
    }
  }

  t.end();
});
