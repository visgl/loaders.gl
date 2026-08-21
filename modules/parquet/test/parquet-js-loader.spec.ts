// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ParquetJSLoader} from '@loaders.gl/parquet';
import {validateLoader} from 'test/common/conformance';

test('ParquetJSLoader exposes the TypeScript-backed parser', async t => {
  validateLoader(t, ParquetJSLoader, 'ParquetJSLoader');

  const table = await load(
    '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet',
    ParquetJSLoader,
    {core: {worker: false}}
  );

  t.equal(table.shape, 'object-row-table', 'returns object rows from the TypeScript backend');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 2, 'parses the fixture rows');
  }
  t.end();
});
