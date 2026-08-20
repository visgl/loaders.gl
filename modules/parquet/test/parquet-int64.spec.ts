// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {encode, load} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

const EXACT_INT64_VALUES = [9007199254740993n, -9007199254740993n, 9223372036854775807n];

/** Creates a physical INT64 Parquet fixture containing values that cannot be represented as numbers. */
async function createExactInt64Fixture(): Promise<ArrayBuffer> {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [{name: 'value', type: 'int64', nullable: false}],
      metadata: {}
    },
    data: EXACT_INT64_VALUES.map(value => ({value}))
  };

  return await encode(table, ParquetJSWriter, {worker: false});
}

test('ParquetJSLoader preserves physical INT64 values as exact bigint object rows', async () => {
  const parquetBuffer = await createExactInt64Fixture();
  const table = await load(parquetBuffer, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'object-row-table'}
  });

  expect(table.shape).toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.schema?.fields[0].type).toBe('int64');
    expect(table.data.map(row => row.value)).toEqual(EXACT_INT64_VALUES);
  }
});

test('ParquetJSLoader preserves physical INT64 values in Arrow Int64 vectors', async () => {
  const parquetBuffer = await createExactInt64Fixture();
  const table = await load(parquetBuffer, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  expect(table.shape).toBe('arrow-table');
  if (table.shape === 'arrow-table') {
    expect(table.data.schema.fields[0].type).toBeInstanceOf(arrow.Int64);
    expect(Array.from(table.data.getChildAt(0) || [])).toEqual(EXACT_INT64_VALUES);
  }
});

test('ParquetJSWriter rejects unsafe number inputs instead of silently corrupting INT64 values', async () => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [{name: 'value', type: 'int64', nullable: false}],
      metadata: {}
    },
    data: [{value: Number.MAX_SAFE_INTEGER + 1}]
  };

  await expect(encode(table, ParquetJSWriter, {worker: false})).rejects.toThrow(
    'invalid value for INT64'
  );
});
