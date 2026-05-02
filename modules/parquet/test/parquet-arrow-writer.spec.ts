// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {encode, load} from '@loaders.gl/core';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import * as parquet from '@loaders.gl/parquet';
import * as bundledParquet from '@loaders.gl/parquet/bundled';
import * as unbundledParquet from '@loaders.gl/parquet/unbundled';
import {ParquetJSLoader, ParquetJSWriter, ParquetLoader, ParquetWriter} from '@loaders.gl/parquet';
import * as arrow from 'apache-arrow';

test('ParquetWriter#writer objects', (t) => {
  t.ok(ParquetWriter, 'ParquetWriter');
  t.ok(ParquetJSLoader, 'ParquetJSLoader');
  t.ok(ParquetJSWriter, 'ParquetJSWriter');
  t.end();
});

test('ParquetWriter#removed Arrow variant exports are absent', (t) => {
  t.notOk('ParquetArrowLoader' in parquet, 'root does not export ParquetArrowLoader');
  t.notOk('ParquetArrowWorkerLoader' in parquet, 'root does not export ParquetArrowWorkerLoader');
  t.notOk('ParquetArrowLoaderOptions' in parquet, 'root does not export ParquetArrowLoaderOptions');
  t.notOk('ParquetArrowWriter' in parquet, 'root does not export ParquetArrowWriter');
  t.notOk('ParquetArrowWriterOptions' in parquet, 'root does not export ParquetArrowWriterOptions');
  t.notOk('ParquetArrowLoader' in bundledParquet, 'bundled does not export ParquetArrowLoader');
  t.notOk(
    'ParquetArrowWorkerLoader' in bundledParquet,
    'bundled does not export ParquetArrowWorkerLoader'
  );
  t.notOk(
    'ParquetArrowLoader' in unbundledParquet,
    'unbundled does not export ParquetArrowLoader'
  );
  t.notOk(
    'ParquetArrowWorkerLoader' in unbundledParquet,
    'unbundled does not export ParquetArrowWorkerLoader'
  );
  t.end();
});

test('ParquetWriter#removed JSON aliases are absent', (t) => {
  t.notOk('ParquetJSONLoader' in parquet, 'ParquetJSONLoader removed');
  t.notOk('ParquetJSONWorkerLoader' in parquet, 'ParquetJSONWorkerLoader removed');
  t.notOk('ParquetJSONWriter' in parquet, 'ParquetJSONWriter removed');
  t.notOk('_ParquetJSONLoader' in parquet, '_ParquetJSONLoader removed');
  t.notOk('_ParquetJSONWriter' in parquet, '_ParquetJSONWriter removed');
  t.end();
});

test('ParquetWriter#encodes Arrow tables through primary writer', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetWriter, {
    worker: false
  });
  const newTable = (await load(parquetBuffer, ParquetLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  })) as ArrowTable;

  t.deepEqual(table.data.schema, newTable.data.schema);
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
    core: {worker: false}
  });

  t.equal(newTable.shape, 'object-row-table');
  if (newTable.shape === 'object-row-table') {
    t.deepEqual(newTable.data, table.data);
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
