// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {NDJSONArrowLoader, NDJSONLoader} from '@loaders.gl/json';

const NDJSON_PATH = '@loaders.gl/json/test/data/ndjson.ndjson';
const NDJSON_EMPTY_OBJECTS_PATH = '@loaders.gl/json/test/data/ndjson-empty-objects.ndjson';
const NDJSON_INVALID_PATH = '@loaders.gl/json/test/data/ndjson-invalid.ndjson';

test('NDJSONLoader#load(ndjson.ndjson)', async t => {
  const table = await load(NDJSON_PATH, NDJSONLoader);
  t.equal(table.data.length, 11, 'Correct number of rows received');
  t.end();
});

test('NDJSONLoader#load(ndjson-invalid.ndjson)', async t => {
  await t.rejects(
    () => load(NDJSON_INVALID_PATH, NDJSONLoader),
    /failed to parse JSON on line 9/,
    'throws on invalid ndjson'
  );
  t.end();
});

test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = auto)', async t => {
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

  // t.comment(JSON.stringify(batchCount));
  t.equal(batchCount, 11, 'Correct number of batches received');
  t.equal(rowCount, 11, 'Correct number of row received');
  t.equal(byteLength, 701, 'Correct number of bytes received');
  t.end();
});

test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = 5)', async t => {
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

test.skip('NDJSONLoader#loadInBatches(ndjson-invalid.ndjson)', async t => {
  const iterator = await loadInBatches(NDJSON_INVALID_PATH, NDJSONLoader, {
    batchSize: 5
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  // eslint-disable-next-line dot-notation
  const firstBatch = await iterator['next']();
  t.ok(firstBatch);
  await t.rejects(
    // eslint-disable-next-line dot-notation
    () => iterator['next'](),
    /failed to parse JSON on line 9/,
    'throws on invalid ndjson'
  );
  t.end();
});

test('NDJSONArrowLoader#load(ndjson.ndjson)', async t => {
  const classicTable = await load(NDJSON_PATH, NDJSONLoader);
  const table = await load(NDJSON_PATH, NDJSONArrowLoader);
  t.equal(table.shape, 'arrow-table', 'Correct table type received');
  t.equal(table.data.numRows, classicTable.data.length, 'row count matches NDJSONLoader');

  for (let rowIndex = 0; rowIndex < classicTable.data.length; rowIndex++) {
    for (const [fieldName, value] of Object.entries(classicTable.data[rowIndex])) {
      t.equal(
        table.data.getChild(fieldName)?.get(rowIndex),
        value,
        `${fieldName} row ${rowIndex} matches NDJSONLoader`
      );
    }
  }

  t.end();
});

test('NDJSONArrowLoader#load(ndjson-invalid.ndjson)', async t => {
  await t.rejects(
    () => load(NDJSON_INVALID_PATH, NDJSONArrowLoader),
    /failed to parse JSON on line 9/,
    'throws on invalid ndjson'
  );
  t.end();
});

test('NDJSONArrowLoader#loadInBatches(ndjson.ndjson, batchSize = 5)', async t => {
  const classicIterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5
  });
  const classicBatches: any[] = [];
  for await (const batch of classicIterator) {
    classicBatches.push(batch);
  }

  const iterator = await loadInBatches(NDJSON_PATH, NDJSONArrowLoader, {
    batchSize: 5
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    const classicBatch = classicBatches[batchCount];
    t.equal(batch.shape, 'arrow-table', `Got correct batch type for batch ${batchCount}`);
    t.equal(
      batch.data.numRows,
      classicBatch.length,
      `batch ${batchCount} row count matches NDJSONLoader`
    );

    for (let rowIndex = 0; rowIndex < classicBatch.data.length; rowIndex++) {
      for (const [fieldName, value] of Object.entries(classicBatch.data[rowIndex])) {
        t.equal(
          batch.data.getChild(fieldName)?.get(rowIndex),
          value,
          `batch ${batchCount} ${fieldName} row ${rowIndex} matches NDJSONLoader`
        );
      }
    }

    rowCount += batch.data.numRows;
    batchCount++;
  }

  t.equal(batchCount, classicBatches.length, 'batch count matches NDJSONLoader');
  t.equal(rowCount, 11, 'Correct number of row received');
  t.end();
});

test('NDJSONArrowLoader#load(ndjson-empty-objects.ndjson)', async t => {
  const classicTable = await load(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader);
  const table = await load(NDJSON_EMPTY_OBJECTS_PATH, NDJSONArrowLoader);

  t.equal(table.shape, 'arrow-table', 'Correct table type received');
  t.equal(table.data.numCols, 0, 'Correct number of columns received');
  t.equal(table.data.numRows, classicTable.data.length, 'row count matches NDJSONLoader');
  t.end();
});

test('NDJSONArrowLoader#loadInBatches(ndjson-empty-objects.ndjson, batchSize = 2)', async t => {
  const classicIterator = await loadInBatches(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader, {
    batchSize: 2
  });
  const classicBatches: any[] = [];
  for await (const batch of classicIterator) {
    classicBatches.push(batch);
  }

  const iterator = await loadInBatches(NDJSON_EMPTY_OBJECTS_PATH, NDJSONArrowLoader, {
    batchSize: 2
  });

  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    const classicBatch = classicBatches[batchCount];
    t.equal(batch.shape, 'arrow-table', `Got correct batch type for batch ${batchCount}`);
    t.equal(batch.data.numCols, 0, `Got correct column count for batch ${batchCount}`);
    t.equal(
      batch.data.numRows,
      classicBatch.length,
      `batch ${batchCount} row count matches NDJSONLoader`
    );
    rowCount += batch.data.numRows;
    batchCount++;
  }

  t.equal(batchCount, classicBatches.length, 'batch count matches NDJSONLoader');
  t.equal(
    rowCount,
    classicBatches.reduce((sum, batch) => sum + batch.length, 0),
    'row count matches'
  );
  t.end();
});
