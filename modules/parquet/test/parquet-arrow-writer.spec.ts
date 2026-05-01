// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import * as parquet from '@loaders.gl/parquet';
import {ParquetArrowWriter, ParquetJSLoader, ParquetJSWriter, ParquetWriter} from '@loaders.gl/parquet';

test('ParquetWriter#writer objects', (t) => {
  t.ok(ParquetArrowWriter, 'ParquetArrowWriter');
  t.ok(ParquetWriter, 'ParquetWriter');
  t.ok(ParquetJSLoader, 'ParquetJSLoader');
  t.ok(ParquetJSWriter, 'ParquetJSWriter');
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
