import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {NDJSONLoader} from '@loaders.gl/json';

const NDJSON_PATH = `@loaders.gl/json/test/data/ndjson.ndjson`;

test('NDJSONLoader#load(ndjson.ndjson)', async (t) => {
  const data = await load(NDJSON_PATH, NDJSONLoader);
  t.equal(data.length, 11, 'Correct number of rows received');
  t.end();
});

test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = auto)', async (t) => {
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  let byteLength = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
    byteLength = batch.bytesUsed;
  }

  t.comment(JSON.stringify(batchCount));
  t.equal(batchCount, 11, 'Correct number of batches received');
  t.equal(rowCount, 11, 'Correct number of row received');
  t.equal(byteLength, 701, 'Correct number of bytes received');
  t.end();
});
