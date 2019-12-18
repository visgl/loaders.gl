import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
// import {ColumnarTableBatch} from '@loaders.gl/tables';
import {JSONLoader} from '@loaders.gl/json';

const GEOJSON_PATH = `@loaders.gl/json/test/data/geojson-big.json`;

test('JSONLoader#load(geojson.json)', async t => {
  const data = await load(GEOJSON_PATH, JSONLoader, {json: {table: true}});
  t.equal(data.length, 308, 'Correct number of row received');
  t.end();
});

test('JSONLoader#loadInBatches(geojson.json, rows, batchSize = 10)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {batchSize: 10}
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    if (batchCount < 30) {
      t.equal(batch.length, 10, `Got correct batch size for batch ${batchCount}`);
    }

    const feature = batch.data[0];
    t.equal(feature.type, 'Feature', 'row 0 valid');
    t.equal(feature.geometry.type, 'Point', 'row 0 valid');

    batchCount++;
    rowCount += batch.length;
  }

  const lastFeature = batch.data[batch.data.length - 1];
  t.equal(lastFeature.type, 'Feature', 'row 0 valid');
  t.equal(lastFeature.properties.name, 'West Oakland (WOAK)', 'row 0 valid');

  t.equal(batchCount, 31, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});

test('JSONLoader#loadInBatches(geojson.json, rows, batchSize = auto)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
  }

  t.ok(batchCount <= 3, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});

/*
test('JSONLoader#loadInBatches(geojson.json, columns, batchSize = auto)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {
      TableBatch: ColumnarTableBatch
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;

  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
  }

  t.ok(batchCount <= 3, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});
*/
