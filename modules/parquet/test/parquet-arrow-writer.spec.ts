// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import * as parquet from '@loaders.gl/parquet';
import * as bundledParquet from '@loaders.gl/parquet/bundled';
import * as unbundledParquet from '@loaders.gl/parquet/unbundled';
import {ParquetJSLoader, ParquetJSWriter, ParquetWriter} from '@loaders.gl/parquet';

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
