import test from 'tape-promise/tape';
import {loadFileInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
// import {isBrowser, readFile, loadFile} from '@loaders.gl/core';
// import {parseFileAsIterator, parseFileAsAsyncIterator} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
// const CSV_SAMLE_LONG_URL = '@loaders.gl/csv/test/data/sample-long.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';

test('CSVLoader#loadFileInBatches(sample.csv)', async t => {
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

test('CSVLoader#loadFileInBatches(sample-very-long.csv)', async t => {
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
