// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {load, loadInBatches, encode, setLoaderOptions} from '@loaders.gl/core';
import type {ArrowTable} from '@loaders.gl/schema';
import {ParquetArrowLoader, ParquetArrowWriter} from '@loaders.gl/parquet';
import * as arrow from 'apache-arrow';
import {WASM_SUPPORTED_FILES} from './data/files';

const PARQUET_DIR = '@loaders.gl/parquet/test/data';

setLoaderOptions({
  _workerType: 'test'
});

test('ParquetArrowLoader#loader objects', (t) => {
  // Not sure why validateLoader calls parse? Raises an error about "Invalid Parquet file"
  // validateLoader(t, ParquetArrowLoader, 'ParquetArrowLoader');
  // validateLoader(t, ParquetWorkerLoader, 'ParquetWorkerLoader');
  t.end();
});

test('ParquetArrowLoader#Load Parquet file', async (t) => {
  const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
  const table = await load(url, ParquetArrowLoader, {});
  const arrowTable = table.data;
  t.equal(arrowTable.numRows, 5);
  t.deepEqual(table.schema?.fields.map((f) => f.name), [
    'pop_est',
    'continent',
    'name',
    'iso_a3',
    'gdp_md_est',
    'geometry'
  ]);
  t.end();
});

test('ParquetArrowLoader#load', async (t) => {
  // t.comment('SUPPORTED FILES');
  for (const {title, path} of WASM_SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/apache/${path}`;
    const table = await load(url, ParquetArrowLoader);
    const arrowTable = table.data;
    t.ok(arrowTable instanceof arrow.Table, `GOOD(${title})`);
  }

  t.end();
});

test('ParquetArrowWriter#writer/loader round trip', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetArrowWriter, {
    worker: false,
  });
  const newTable = await load(parquetBuffer, ParquetArrowLoader, {
   core: {worker: false},
  });

  t.deepEqual(table.data.schema, newTable.data.schema);
  t.end();
});

// TODO not implemented yet
test.skip('ParquetArrowLoader#loadInBatches', async (t) => {
  // t.comment('SUPPORTED FILES');
  for (const {title, path} of WASM_SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/apache/${path}`;
    const iterator = await loadInBatches(url, ParquetArrowLoader);
    for await (const batch of iterator) {
      const recordBatch = batch.data;
      t.ok(recordBatch instanceof arrow.RecordBatch, `GOOD(${title})`);
    }
  }

  t.end();
});

function createArrowTable(): ArrowTable {
  const utf8Vector = arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8());
  const boolVector = arrow.vectorFromArray([true, true, false, false], new arrow.Bool());
  const uint8Vector = arrow.vectorFromArray([1, 2, 3, 4], new arrow.Uint8());
  const int32Vector = arrow.vectorFromArray([0, -2147483638, 2147483637, 1], new arrow.Uint32());

  const table = new arrow.Table({utf8Vector, uint8Vector, int32Vector, boolVector});
  return {shape: 'arrow-table', data: table};
}
