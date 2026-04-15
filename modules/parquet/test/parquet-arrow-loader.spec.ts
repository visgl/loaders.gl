// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {load, loadInBatches, encode, fetchFile, setLoaderOptions} from '@loaders.gl/core';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {ParquetArrowLoader, ParquetArrowWriter, ParquetLoader, ParquetWriter} from '@loaders.gl/parquet';
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

test('ParquetArrowLoader#parse applies reader options without passing wasmUrl upstream', async (t) => {
  const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
  const response = await fetchFile(url);
  const arrayBuffer = await response.arrayBuffer();
  const table = await ParquetArrowLoader.parse(arrayBuffer, {
    parquet: {
      limit: 2
    }
  });

  t.equal(table.data.numRows, 2, 'applies limit option');
  t.deepEqual(
    table.schema?.fields.map((field) => field.name),
    ['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry'],
    'keeps the file schema'
  );

  t.end();
});

test('ParquetArrowLoader#load supports js implementation', async (t) => {
  const url = `${PARQUET_DIR}/apache/good/alltypes_plain.parquet`;
  const table = await load(url, ParquetArrowLoader, {
    parquet: {
      implementation: 'js',
      limit: 3,
      offset: 1,
      columns: ['id', 'bool_col']
    }
  });

  t.equal(table.shape, 'arrow-table');
  t.equal(table.data.numRows, 3, 'applies limit and offset');
  t.deepEqual(
    table.schema?.fields.map((field) => field.name),
    ['id', 'bool_col'],
    'applies projected columns'
  );
  t.end();
});

test('ParquetArrowLoader#loadInBatches supports js implementation batchSize', async (t) => {
  const url = `${PARQUET_DIR}/apache/good/alltypes_plain.parquet`;
  const iterator = await loadInBatches(url, ParquetArrowLoader, {
    parquet: {
      implementation: 'js',
      offset: 1,
      limit: 5,
      batchSize: 2,
      columns: ['id']
    }
  });

  const batchLengths: number[] = [];
  for await (const batch of iterator) {
    batchLengths.push(batch.length);
    t.equal(batch.shape, 'arrow-table');
    t.deepEqual(batch.schema.fields.map((field) => field.name), ['id']);
  }

  t.deepEqual(batchLengths, [2, 2, 1], 'chunks js batches using batchSize');
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

test('ParquetArrowWriter#js implementation is not implemented', async (t) => {
  const table = createArrowTable();

  await t.rejects(
    () => encode(table, ParquetArrowWriter, {parquet: {implementation: 'js'}}),
    /implementation "js" is not implemented yet/
  );

  t.end();
});

test('ParquetLoader#returns object rows through Arrow adapter', async (t) => {
  const url = `${PARQUET_DIR}/apache/good/alltypes_plain.parquet`;
  const table = (await load(url, ParquetLoader, {
    parquet: {
      implementation: 'js',
      limit: 2,
      columns: ['id', 'bool_col']
    }
  })) as ObjectRowTable;

  t.equal(table.shape, 'object-row-table');
  t.equal(table.data.length, 2);
  t.deepEqual(Object.keys(table.data[0]), ['id', 'bool_col']);
  t.end();
});

test('ParquetWriter#encodes plain JS tables through Arrow adapter', async (t) => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    data: [
      {city: 'Paris', count: 2},
      {city: 'New York', count: 5}
    ]
  };

  const parquetBuffer = await encode(table, ParquetWriter, {
    worker: false
  });
  const newTable = await load(parquetBuffer, ParquetLoader, {
    core: {worker: false},
    parquet: {implementation: 'js'}
  });

  t.equal(newTable.shape, 'object-row-table');
  if (newTable.shape === 'object-row-table') {
    t.deepEqual(newTable.data, table.data);
  }
  t.end();
});

test('ParquetArrowLoader#loadInBatches', async (t) => {
  const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
  const iterator = await loadInBatches(url, ParquetArrowLoader, {
    parquet: {
      batchSize: 2,
      limit: 5
    }
  });

  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    batchCount++;
    rowCount += batch.length;
    t.ok(batch.data instanceof arrow.Table, 'returns Arrow table batch');
    t.deepEqual(
      batch.schema.fields.map((field) => field.name),
      ['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry'],
      'batch schema matches file schema'
    );
  }

  t.ok(batchCount > 0, 'returns one or more batches');
  t.equal(rowCount, 5, 'returns all requested rows');

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
