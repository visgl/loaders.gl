// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {NDJSONLoader} from '@loaders.gl/json';
import * as json from '@loaders.gl/json';
import * as bundledJson from '@loaders.gl/json/bundled';
import * as unbundledJson from '@loaders.gl/json/unbundled';
const NDJSON_PATH = '@loaders.gl/json/test/data/ndjson.ndjson';
const NDJSON_EMPTY_OBJECTS_PATH = '@loaders.gl/json/test/data/ndjson-empty-objects.ndjson';
const NDJSON_INVALID_PATH = '@loaders.gl/json/test/data/ndjson-invalid.ndjson';
test('NDJSONLoader#load(ndjson.ndjson)', async () => {
  const table = await load(NDJSON_PATH, NDJSONLoader);
  expect(table.data.length, 'Correct number of rows received').toBe(11);
});
test('NDJSONLoader#load(ndjson.ndjson, shape: arrow-table)', async () => {
  const classicTable = await load(NDJSON_PATH, NDJSONLoader);
  const table = await load(NDJSON_PATH, NDJSONLoader, {ndjson: {shape: 'arrow-table'}});
  expect(table.shape, 'Correct Arrow table type received').toBe('arrow-table');
  expect(table.data.numRows, 'row count matches default NDJSONLoader').toBe(
    classicTable.data.length
  );
  for (let rowIndex = 0; rowIndex < classicTable.data.length; rowIndex++) {
    for (const [fieldName, value] of Object.entries(classicTable.data[rowIndex])) {
      expect(
        table.data.getChild(fieldName)?.get(rowIndex),
        `${fieldName} row ${rowIndex} matches default NDJSONLoader`
      ).toBe(value);
    }
  }
});
test('NDJSONLoader#removed Arrow loader exports', () => {
  expect('NDJSONArrowLoader' in json, 'root does not export NDJSONArrowLoader').toBeFalsy();
  expect(
    'NDJSONArrowLoader' in bundledJson,
    'bundled does not export NDJSONArrowLoader'
  ).toBeFalsy();
  expect(
    'NDJSONArrowLoader' in unbundledJson,
    'unbundled does not export NDJSONArrowLoader'
  ).toBeFalsy();
});
test('NDJSONLoader#load(ndjson-invalid.ndjson)', async () => {
  await await expect(
    load(NDJSON_INVALID_PATH, NDJSONLoader),
    'throws on invalid ndjson'
  ).rejects.toThrow(/failed to parse JSON on line 9/);
});
test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = auto)', async () => {
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader);
  expect(
    isIterator(iterator) || isAsyncIterable(iterator),
    'loadInBatches returned iterator'
  ).toBeTruthy();
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
  expect(batchCount, 'Correct number of batches received').toBe(11);
  expect(rowCount, 'Correct number of row received').toBe(11);
  expect(byteLength, 'Correct number of bytes received').toBe(701);
});
test('NDJSONLoader#loadInBatches(ndjson.ndjson, rows, batchSize = 5)', async () => {
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5
  });
  expect(
    isIterator(iterator) || isAsyncIterable(iterator),
    'loadInBatches returned iterator'
  ).toBeTruthy();
  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    if (batchCount < 2) {
      expect(batch.length, `Got correct batch size for batch ${batchCount}`).toBe(5);
    }
    const feature = batch.data[0];
    expect(typeof feature.id, 'id valid').toBe('number');
    expect(typeof feature.points, 'points valid').toBe('string');
    batchCount++;
    rowCount += batch.length;
  }
  const lastFeature = batch.data[batch.data.length - 1];
  expect(lastFeature.id, 'last feature id valid').toBe(10);
  expect(lastFeature.points, 'last feature points valid').toBe(
    'POINT(-74.1736845958281 42.8112860241873)'
  );
  expect(batchCount, 'Correct number of batches received').toBe(3);
  expect(rowCount, 'Correct number of row received').toBe(11);
});
test('NDJSONLoader#loadInBatches(ndjson.ndjson, shape: arrow-table, batchSize = 5)', async () => {
  const classicIterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5
  });
  const classicBatches: any[] = [];
  for await (const batch of classicIterator) {
    classicBatches.push(batch);
  }
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5,
    ndjson: {shape: 'arrow-table'}
  });
  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    const classicBatch = classicBatches[batchCount];
    expect(batch.shape, `Got correct Arrow batch type for batch ${batchCount}`).toBe('arrow-table');
    expect(batch.data.numRows, `batch ${batchCount} row count matches default NDJSONLoader`).toBe(
      classicBatch.length
    );
    for (let rowIndex = 0; rowIndex < classicBatch.data.length; rowIndex++) {
      for (const [fieldName, value] of Object.entries(classicBatch.data[rowIndex])) {
        expect(
          batch.data.getChild(fieldName)?.get(rowIndex),
          `batch ${batchCount} ${fieldName} row ${rowIndex} matches default NDJSONLoader`
        ).toBe(value);
      }
    }
    rowCount += batch.data.numRows;
    batchCount++;
  }
  expect(batchCount, 'batch count matches default NDJSONLoader').toBe(classicBatches.length);
  expect(rowCount, 'Correct number of Arrow rows received').toBe(11);
});
test.skip('NDJSONLoader#loadInBatches(ndjson-invalid.ndjson)', async () => {
  const iterator = await loadInBatches(NDJSON_INVALID_PATH, NDJSONLoader, {
    batchSize: 5
  });
  expect(
    isIterator(iterator) || isAsyncIterable(iterator),
    'loadInBatches returned iterator'
  ).toBeTruthy();
  // eslint-disable-next-line dot-notation
  const firstBatch = await iterator['next']();
  expect(firstBatch).toBeTruthy();
  await await expect(iterator['next'](), 'throws on invalid ndjson').rejects.toThrow(
    /failed to parse JSON on line 9/
  );
});
test('NDJSONLoader#load(ndjson-empty-objects.ndjson, shape: arrow-table)', async () => {
  const table = await load(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader, {
    ndjson: {shape: 'arrow-table'}
  });
  expect(table.shape, 'Correct table type received').toBe('arrow-table');
  expect(table.data.numCols, 'Correct number of columns received').toBe(0);
  expect(table.data.numRows, 'Correct number of rows received').toBe(3);
});
test('NDJSONLoader#load(ndjson.ndjson, shape: arrow-table) matches rows', async () => {
  const classicTable = await load(NDJSON_PATH, NDJSONLoader);
  const table = await load(NDJSON_PATH, NDJSONLoader, {
    ndjson: {shape: 'arrow-table'}
  });
  expect(table.shape, 'Correct table type received').toBe('arrow-table');
  expect(table.data.numRows, 'row count matches NDJSONLoader').toBe(classicTable.data.length);
  for (let rowIndex = 0; rowIndex < classicTable.data.length; rowIndex++) {
    for (const [fieldName, value] of Object.entries(classicTable.data[rowIndex])) {
      expect(
        table.data.getChild(fieldName)?.get(rowIndex),
        `${fieldName} row ${rowIndex} matches NDJSONLoader`
      ).toBe(value);
    }
  }
});
test('NDJSONLoader#load(ndjson-invalid.ndjson, shape: arrow-table)', async () => {
  await await expect(
    load(NDJSON_INVALID_PATH, NDJSONLoader, {ndjson: {shape: 'arrow-table'}}),
    'throws on invalid ndjson'
  ).rejects.toThrow(/failed to parse JSON on line 9/);
});
test('NDJSONLoader#loadInBatches(ndjson.ndjson, shape: arrow-table, batchSize = 5) matches rows', async () => {
  const classicIterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5
  });
  const classicBatches: any[] = [];
  for await (const batch of classicIterator) {
    classicBatches.push(batch);
  }
  const iterator = await loadInBatches(NDJSON_PATH, NDJSONLoader, {
    batchSize: 5,
    ndjson: {shape: 'arrow-table'}
  });
  expect(
    isIterator(iterator) || isAsyncIterable(iterator),
    'loadInBatches returned iterator'
  ).toBeTruthy();
  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    const classicBatch = classicBatches[batchCount];
    expect(batch.shape, `Got correct batch type for batch ${batchCount}`).toBe('arrow-table');
    expect(batch.data.numRows, `batch ${batchCount} row count matches NDJSONLoader`).toBe(
      classicBatch.length
    );
    for (let rowIndex = 0; rowIndex < classicBatch.data.length; rowIndex++) {
      for (const [fieldName, value] of Object.entries(classicBatch.data[rowIndex])) {
        expect(
          batch.data.getChild(fieldName)?.get(rowIndex),
          `batch ${batchCount} ${fieldName} row ${rowIndex} matches NDJSONLoader`
        ).toBe(value);
      }
    }
    rowCount += batch.data.numRows;
    batchCount++;
  }
  expect(batchCount, 'batch count matches NDJSONLoader').toBe(classicBatches.length);
  expect(rowCount, 'Correct number of row received').toBe(11);
});
test('NDJSONLoader#load(ndjson-empty-objects.ndjson, shape: arrow-table) matches rows', async () => {
  const classicTable = await load(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader);
  const table = await load(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader, {
    ndjson: {shape: 'arrow-table'}
  });
  expect(table.shape, 'Correct table type received').toBe('arrow-table');
  expect(table.data.numCols, 'Correct number of columns received').toBe(0);
  expect(table.data.numRows, 'row count matches NDJSONLoader').toBe(classicTable.data.length);
});
test('NDJSONLoader#loadInBatches(ndjson-empty-objects.ndjson, shape: arrow-table, batchSize = 2)', async () => {
  const iterator = await loadInBatches(NDJSON_EMPTY_OBJECTS_PATH, NDJSONLoader, {
    batchSize: 2,
    ndjson: {shape: 'arrow-table'}
  });
  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.shape, `Got correct batch type for batch ${batchCount}`).toBe('arrow-table');
    expect(batch.data.numCols, `Got correct column count for batch ${batchCount}`).toBe(0);
    rowCount += batch.data.numRows;
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(2);
  expect(rowCount, 'Correct number of rows received').toBe(3);
});
