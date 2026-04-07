// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {CSVArrowLoader, CSVRawArrowLoader, CSVTypedArrowLoader} from '@loaders.gl/csv';
import * as arrow from 'apache-arrow';
import type {ArrowTableBatch} from '@loaders.gl/schema';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';
const CSV_INCIDENTS_URL_QUOTES = '@loaders.gl/csv/test/data/sf_incidents-small.csv';

test('CSVArrowLoader#loadInBatches(numbers-100.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVArrowLoader, {
    batchSize: 40
  });

  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 3, 'Correct number of batches received');

  t.end();
});

test('CSVArrowLoader#loadInBatches(numbers-10000.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVArrowLoader, {
    batchSize: 2000
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});

test('CSVArrowLoader#loadInBatches(incidents.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVArrowLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVRawArrowLoader#load(numbers-100.csv)', async (t) => {
  const table = await load(CSV_NUMBERS_100_URL, CSVRawArrowLoader);

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 101, 'returns all rows without inferring a header');

  const zipColumn = table.data.getChild('column2');
  t.equal(zipColumn?.get(1), '09857', 'retains leading zeroes by parsing as strings');

  const fieldTypeNames = table.data.schema.fields.map((field) => field.type.toString());
  t.ok(fieldTypeNames.every((typeName) => typeName === 'Utf8'), 'all columns are Utf8');

  t.end();
});

test('CSVRawArrowLoader#loadInBatches(numbers-100.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVRawArrowLoader, {
    batchSize: 40
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow table batch');
    const fieldTypeNames = batch.data.schema.fields.map((field) => field.type.toString());
    t.ok(fieldTypeNames.every((typeName) => typeName === 'Utf8'), 'all batch columns are Utf8');

    rowCount += batch.data.numRows;
  }

  t.equal(rowCount, 101, 'returns all rows across batches without inferring a header');

  t.end();
});

test('CSVTypedArrowLoader#load(numbers-100.csv)', async (t) => {
  const table = await load(CSV_NUMBERS_100_URL, CSVTypedArrowLoader);

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 100, 'respects header detection and excludes header row');

  const zipColumn = table.data.getChildAt(1);
  t.equal(zipColumn?.get(0), 9857, 'applies dynamic typing by default');

  const fieldTypeNames = table.data.schema.fields.map((field) => field.type.toString());
  t.ok(fieldTypeNames.every((typeName) => typeName === 'Float64'), 'numeric columns are typed');

  t.end();
});

test('CSVTypedArrowLoader#load(numbers-100.csv, dynamicTyping false)', async (t) => {
  const table = await load(CSV_NUMBERS_100_URL, CSVTypedArrowLoader, {
    csv: {
      dynamicTyping: false
    }
  });

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 100, 'respects header detection and excludes header row');

  const zipColumn = table.data.getChildAt(1);
  t.equal(zipColumn?.get(0), '09857', 'keeps strings when dynamic typing is disabled');

  const fieldTypeNames = table.data.schema.fields.map((field) => field.type.toString());
  t.ok(fieldTypeNames.every((typeName) => typeName === 'Utf8'), 'all columns are Utf8');

  t.end();
});

test('CSVTypedArrowLoader#loadInBatches(numbers-100.csv)', async (t) => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVTypedArrowLoader, {
    batchSize: 40
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow table batch');
    const fieldTypeNames = batch.data.schema.fields.map((field) => field.type.toString());
    t.ok(fieldTypeNames.every((typeName) => typeName === 'Float64'), 'all batch columns are typed');

    rowCount += batch.data.numRows;
  }

  t.equal(rowCount, 100, 'returns all data rows across batches');

  t.end();
});

test('CSVTypedArrowLoader#parseInBatches freezes schema after first typed batch', async (t) => {
  const csvText = 'value\n1\nfoo\n';
  const csvBuffer = new TextEncoder().encode(csvText);

  const iterator = CSVTypedArrowLoader.parseInBatches([csvBuffer], {
    core: {
      batchSize: 1
    },
    csv: {
      header: true
    }
  });

  const batches: ArrowTableBatch[] = [];
  for await (const batch of iterator) {
    batches.push(batch);
  }

  t.equal(batches.length, 2, 'returns one row per batch');

  const firstBatchColumnTypeName = batches[0]?.data.schema.fields[0]?.type.toString();
  const secondBatchColumnTypeName = batches[1]?.data.schema.fields[0]?.type.toString();
  t.equal(firstBatchColumnTypeName, 'Float64', 'first batch infers float64');
  t.equal(secondBatchColumnTypeName, 'Float64', 'second batch keeps frozen float64 schema');

  const firstBatchValue = batches[0]?.data.getChildAt(0)?.get(0);
  const secondBatchValue = batches[1]?.data.getChildAt(0)?.get(0);
  t.equal(firstBatchValue, 1, 'first batch keeps typed numeric value');
  t.equal(secondBatchValue, null, 'second batch coerces incompatible string value to null');

  t.end();
});
