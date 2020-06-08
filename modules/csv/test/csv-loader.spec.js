import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {CSVLoader} from '@loaders.gl/csv';
import {load, loadInBatches, fetchFile, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {ColumnarTableBatch} from '@loaders.gl/tables';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const CSV_STATES_URL = '@loaders.gl/csv/test/data/states.csv';

function validateColumn(column, length, type) {
  if (column.length !== length) {
    return `column length should be ${length}`;
  }
  let validator = null;
  switch (type) {
    case 'string':
      validator = d => typeof d === 'string';
      break;

    case 'float':
      validator = d => Number.isFinite(d);
      break;

    default:
      return null;
  }

  return column.every(validator) ? true : `column elements are not all ${type}s`;
}

test('CSVLoader#loader conformance', t => {
  validateLoader(t, CSVLoader, 'CSVLoader');
  t.end();
});

test('CSVLoader#load(states.csv)', async t => {
  const response = await fetchFile(CSV_STATES_URL);
  const rows = await load(response.body, CSVLoader);
  t.equal(rows.length, 111);
  t.end();
});

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
    csv: {
      TableBatch: ColumnarTableBatch
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');

    t.ok(validateColumn(batch.data[0], batch.length, 'string'), 'column 0 valid');
    t.ok(validateColumn(batch.data[1], batch.length, 'string'), 'column 1 valid');
    t.ok(validateColumn(batch.data[2], batch.length, 'float'), 'column 2 valid');

    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');
  t.end();
});

test('CSVLoader#loadInBatches(sample-very-long.csv, columns)', async t => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    csv: {
      TableBatch: ColumnarTableBatch,
      batchSize
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, batchSize, 'Got correct batch size');

    t.ok(validateColumn(batch.data.TLD, batch.length, 'string'), 'column TLD valid');
    t.ok(
      validateColumn(batch.data['meaning of life'], batch.length, 'float'),
      'column meaning of life valid'
    );
    t.ok(
      validateColumn(batch.data.placeholder, batch.length, 'string'),
      'column placeholder valid'
    );

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
    t.deepEqual(batch.data[0], ['A', 'B', 1], 'Got correct first row');
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, header)', async t => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {csv: {header: false}});
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');
    t.deepEqual(batch.data[0], ['A', 'B', 1], 'Got correct first row');
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, rows)', async t => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');
    t.deepEqual(batch.data[0], ['A', 'B', 1], 'Got correct first row');
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample-very-long.csv, rows)', async t => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {csv: {batchSize}});
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, batchSize, 'Got correct batch size');
    t.ok(batch.data[0].TLD, 'first row has TLD value');
    t.ok(batch.data[0]['meaning of life'], 'first row has meaning of life value');
    t.ok(batch.data[0].placeholder, 'first row has placeholder value');

    batchCount++;
    if (batchCount === 5) {
      break;
    }
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});
