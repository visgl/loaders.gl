// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';

import {encode} from '@loaders.gl/core';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import type {ObjectRowTable} from '@loaders.gl/schema';

let fixture: Blob;

beforeAll(async () => {
  const data = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false},
          {name: 'value', type: 'utf8', nullable: false}
        ],
        metadata: {}
      },
      data: [
        {id: 1, value: 'one'},
        {id: 2, value: 'two'},
        {id: 3, value: 'three'},
        {id: 4, value: 'four'}
      ]
    } satisfies ObjectRowTable,
    ParquetJSWriter
  );
  fixture = new Blob([data]);
});

test('ParquetSource applies a post-filter limit and aligns provenance', async () => {
  const source = new ParquetSource(fixture, {core: {worker: false}});
  const batches = await Array.fromAsync(
    source.read({
      columns: ['value'],
      predicate: {op: '>=', args: [{property: 'id'}, 2]},
      batchSize: 2,
      limit: 1
    })
  );

  expect(batches.flatMap(batch => [...batch.data.getChild('value')!.toArray()])).toEqual(['two']);
  expect(batches.reduce((rowCount, batch) => rowCount + batch.length, 0)).toBe(1);
  expect(
    batches.every(
      batch =>
        batch.rowCount === batch.length &&
        (!batch.rowIndices || batch.rowIndices.length === batch.length)
    )
  ).toBe(true);
  expect(source.getTelemetry().rowsEmitted).toBe(1);
  await source.close();
});
