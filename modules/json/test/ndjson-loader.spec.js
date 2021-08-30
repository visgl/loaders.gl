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

test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = 5)', async (t) => {
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    if (batchCount < 2) {
      t.equal(batch.length, 5, `Got correct batch size for batch ${batchCount}`);
    }

    const feature = batch.data[0];
    t.equal(typeof feature.id, 'number', 'id valid');
    t.equal(typeof feature.points, 'string', 'points valid');

    batchCount++;
    rowCount += batch.length;
  }

  const lastFeature = batch.data[batch.data.length - 1];
  t.equal(lastFeature.id, 10, 'last feature id valid');
  t.equal(
    lastFeature.points,
    'POINT(-74.1736845958281 42.8112860241873)',
    'last feature points valid'
  );

  t.equal(batchCount, 3, 'Correct number of batches received');
  t.equal(rowCount, 11, 'Correct number of row received');
  t.end();
});
