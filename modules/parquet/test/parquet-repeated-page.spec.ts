// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createDataSource, encode} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {
  ParquetSource,
  ParquetSourceLoader as ParquetSourceLoaderWithParser
} from '@loaders.gl/parquet/parquet-source-loader';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

test('ParquetSource keeps repeated columns on the conservative full-chunk path', async () => {
  const parquetBuffer = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false},
          {
            name: 'tags',
            type: {type: 'list', children: [{name: 'element', type: 'utf8', nullable: false}]},
            nullable: false
          }
        ],
        metadata: {}
      },
      data: [
        {id: 0, tags: ['zero', 'common']},
        {id: 1, tags: ['one', 'common']},
        {id: 100, tags: ['hundred', 'common']},
        {id: 101, tags: ['hundred-one', 'common']}
      ]
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {worker: false, parquet: {pageSize: 2, pageIndex: {id: true, tags: true}}}
  );
  const source = createDataSource(new Blob([parquetBuffer]), [ParquetSourceLoaderWithParser], {
    core: {type: 'parquet', worker: false}
  }) as ParquetSource;
  const plan = await source.getScanPlan({
    columns: ['id', 'tags'],
    predicate: {op: '>=', args: [{property: 'id'}, 100]}
  });
  expect(plan.pages.plans[0]?.indexesRead).toBe(0);
  expect(plan.pages.plans[0]?.selectedPages).toBe(0);

  const batches = [];
  for await (const batch of source.read({
    columns: ['id', 'tags'],
    predicate: {op: '>=', args: [{property: 'id'}, 100]}
  })) {
    batches.push(batch);
  }
  expect(
    batches.flatMap(batch => Array.from(batch.data.getChild('id')?.toArray() || []))
  ).toEqual([100, 101]);
  expect(batches[0]?.data.getChild('tags')?.type).toBeInstanceOf(arrow.List);
  await source.close();
});
