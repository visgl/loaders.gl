"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var loadInBatches,isIterator,isAsyncIterable;module.link('@loaders.gl/core',{loadInBatches(v){loadInBatches=v},isIterator(v){isIterator=v},isAsyncIterable(v){isAsyncIterable=v}},1);var ColumnarTableBatch;module.link('@loaders.gl/experimental',{ColumnarTableBatch(v){ColumnarTableBatch=v}},2);var CSVLoader;module.link('@loaders.gl/csv',{CSVLoader(v){CSVLoader=v}},3);




// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
// const CSV_SAMLE_LONG_URL = '@loaders.gl/csv/test/data/sample-long.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';

test('CSVLoader#loadInBatches(sample.csv, columns)', async t => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    TableBatch: ColumnarTableBatch
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 1, 'Got correct batch size');
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
    t.equal(batch.length, 1, 'Got correct batch size');
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
