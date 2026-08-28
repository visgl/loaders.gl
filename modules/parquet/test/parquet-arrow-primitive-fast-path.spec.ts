// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

test('ParquetJSLoader builds nullable primitive Arrow vectors without losing null positions', async () => {
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'integer', type: 'int32', nullable: true},
        {name: 'measurement', type: 'float64', nullable: true},
        {name: 'counter', type: 'int64', nullable: true}
      ],
      metadata: {}
    },
    data: [
      {integer: null, measurement: 1.25, counter: 9_007_199_254_740_993n},
      {integer: 7, measurement: null, counter: -2n},
      {integer: -11, measurement: 3.5, counter: null},
      {integer: null, measurement: null, counter: 4n}
    ]
  };
  const parquet = await encode(input, ParquetJSWriter, {worker: false});
  const table = await load(parquet, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') return;
  expect(Array.from(table.data.getChild('integer')!)).toEqual([null, 7, -11, null]);
  expect(Array.from(table.data.getChild('measurement')!)).toEqual([1.25, null, 3.5, null]);
  expect(Array.from(table.data.getChild('counter')!)).toEqual([
    9_007_199_254_740_993n,
    -2n,
    null,
    4n
  ]);
});

test('ParquetJSLoader direct INT64 delta vectors match object decoding across bit widths 0-64', async () => {
  const url = '@loaders.gl/parquet/test/data/apache/good/delta_binary_packed.parquet';
  const [arrowTable, objectTable] = await Promise.all([
    load(url, ParquetJSLoader, {
      core: {worker: false},
      parquet: {shape: 'arrow-table'}
    }),
    load(url, ParquetJSLoader, {
      core: {worker: false},
      parquet: {shape: 'object-row-table'}
    })
  ]);

  expect(arrowTable.shape).toBe('arrow-table');
  expect(objectTable.shape).toBe('object-row-table');
  if (arrowTable.shape !== 'arrow-table' || objectTable.shape !== 'object-row-table') return;

  for (const field of arrowTable.data.schema.fields) {
    expect(Array.from(arrowTable.data.getChild(field.name) || []), field.name).toEqual(
      objectTable.data.map(row => row[field.name] ?? null)
    );
  }
});
