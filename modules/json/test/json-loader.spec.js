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

// TODO - columnar table batch support not yet fixed
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

async function testContainerBatches(t, iterator, expectedCount) {
  let opencontainerBatchCount = 0;
  let closecontainerBatchCount = 0;

  for await (const batch of iterator) {
    switch (batch.batchType) {
      case 'opencontainer':
        t.ok(batch.container.type, 'batch.container should be set on opencontainer');
        opencontainerBatchCount++;
        break;
      case 'closecontainer':
        t.ok(batch.container.type, 'batch.container should be set on closecontainer');
        closecontainerBatchCount++;
        break;
      default:
        t.notOk(batch.container, 'batch.container should not be set');
    }
  }

  t.equal(opencontainerBatchCount, expectedCount, 'opencontainer batch as expected');
  t.equal(closecontainerBatchCount, expectedCount, 'closecontainer batch as expected');
}

test('JSONLoader#loadInBatches(geojson.json, {_container: true})', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {table: true, _container: true}
  });
  await testContainerBatches(t, iterator, 1);

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {table: true, _container: false}
  });
  await testContainerBatches(t, iterator, 0);

  t.end();
});
