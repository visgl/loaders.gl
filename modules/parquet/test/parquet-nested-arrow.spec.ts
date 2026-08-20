// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {load} from '@loaders.gl/core';
import {ParquetJSLoader} from '@loaders.gl/parquet';

test('ParquetJSLoader projects nested and repeated columns directly to Arrow', async () => {
  const table = await load(
    '@loaders.gl/parquet/test/data/fruits.parquet',
    ParquetJSLoader,
    {
      core: {worker: false},
      parquet: {
        shape: 'arrow-table',
        columns: ['stock', 'colour'],
        offset: 1,
        limit: 3,
        batchSize: 2
      }
    }
  );

  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') {
    return;
  }

  expect(table.data.schema.fields.map(field => field.name)).toEqual(['stock', 'colour']);
  expect(table.data.batches.map(batch => batch.numRows)).toEqual([2, 1]);
  expect(table.data.getChild('colour')?.get(0)?.toArray()).toEqual(['orange']);
  const stock = JSON.parse(
    JSON.stringify(table.data.getChild('stock')?.toArray(), (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
  expect(stock).toEqual([
    [{quantity: ['50', '33'], warehouse: 'X'}],
    [
      {quantity: ['42'], warehouse: 'f'},
      {quantity: ['20'], warehouse: 'x'}
    ],
    []
  ]);
});
