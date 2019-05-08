"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var loadInBatches,isIterator,isAsyncIterable;module.link('@loaders.gl/core',{loadInBatches(v){loadInBatches=v},isIterator(v){isIterator=v},isAsyncIterable(v){isAsyncIterable=v}},1);var CSVLoader;module.link('@loaders.gl/csv',{CSVLoader(v){CSVLoader=v}},2);var ArrowTableBatch;module.link('@loaders.gl/arrow',{ArrowTableBatch(v){ArrowTableBatch=v}},3);var RecordBatch;module.link('apache-arrow',{RecordBatch(v){RecordBatch=v}},4);




// import {Schema, Field, RecordBatch, Float32Vector} from 'apache-arrow';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';

test('CSVLoader#loadInBatches(numbers-100.csv, arrow)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    TableBatch: ArrowTableBatch,
    batchSize: 40
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
    TableBatch: ArrowTableBatch,
    batchSize: 2000
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
