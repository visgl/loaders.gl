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
  // TODO - incorrect length read after 2.3 polyfills upgrade, investigate!
  // let byteLength = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
    // byteLength = batch.bytesUsed;
  }

  t.comment(JSON.stringify(batchCount));
  t.ok(batchCount <= 4, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  // t.equal(byteLength, 135910, 'Correct number of bytes received');
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

test('JSONLoader#loadInBatches(jsonpaths)', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {json: {jsonpaths: ['$.features']}});

  let batchCount = 0;
  let rowCount = 0;
  // let byteLength = 0;
  for await (const batch of iterator) {
    batchCount++;
    rowCount += batch.length;
    // byteLength = batch.bytesUsed;
    t.equal(batch.jsonpath.toString(), '$.features', 'correct jsonpath on batch');
  }

  t.skip(batchCount <= 3, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  // t.equal(byteLength, 135910, 'Correct number of bytes received');

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {json: {jsonpaths: ['$.featureTypo']}});

  rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
  }

  t.equal(rowCount, 0, 'Correct number of row received');
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
      case 'partial-result':
      case 'root-object-batch-partial':
        t.ok(batch.container.type, 'batch.container should be set on partial-result');
        opencontainerBatchCount++;
        break;
      case 'final-result':
      case 'root-object-batch-complete':
        t.ok(batch.container.type, 'batch.container should be set on final-result');
        closecontainerBatchCount++;
        break;
      default:
        t.notOk(batch.container, 'batch.container should not be set');
    }
  }

  t.equal(opencontainerBatchCount, expectedCount, 'partial-result batch as expected');
  t.equal(closecontainerBatchCount, expectedCount, 'final-result batch as expected');
}

test('JSONLoader#loadInBatches(geojson.json, {metadata: true})', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    metadata: true,
    json: {table: true}
  });
  await testContainerBatches(t, iterator, 1);

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    metadata: false,
    json: {table: true}
  });
  await testContainerBatches(t, iterator, 0);

  t.end();
});

test('JSONLoader#loadInBatches(geojson.json, {json: {_rootObjectBatches: true}}) DEPRECATED', async t => {
  let iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {table: true, _rootObjectBatches: true}
  });
  await testContainerBatches(t, iterator, 1);

  iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {table: true, _rootObjectBatches: false}
  });
  await testContainerBatches(t, iterator, 0);

  t.end();
});
