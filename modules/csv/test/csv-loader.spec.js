import test from 'tape-promise/tape';
import {loadFileInBatches} from '@loaders.gl/core';
// import {isBrowser, readFile, loadFile} from '@loaders.gl/core';
// import {parseFileAsIterator, parseFileAsAsyncIterator} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
// const CSV_SAMLE_LONG_URL = '@loaders.gl/csv/test/data/dictionary.csv';
// const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/struct.csv';

test('CSVLoader#loadFile(sample.csv)', async t => {
  const iterator = await loadFileInBatches(CSV_SAMPLE_URL, CSVLoader);
  t.ok(iterator, 'table loaded');
  debugger;
  let i = 0;
  for await (const row of iterator) {
    t.comment(JSON.stringify(row));
    if (++i > 5) {
      break;
    }
  }
  t.end();
});
