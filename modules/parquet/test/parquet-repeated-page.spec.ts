// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {createParquetPagePruningPlan} from '../src/lib/parquet-page-index';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {expect, test} from 'vitest';

test('ParquetReader selectively reads repeated columns when page boundaries align', async () => {
  const parquetBuffer = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false, repeated: true},
          {name: 'tags', type: 'utf8', nullable: false, repeated: true}
        ],
        metadata: {}
      },
      data: [
        {id: [0], tags: ['zero']},
        {id: [1], tags: ['one']},
        {id: [100], tags: ['hundred']},
        {id: [101], tags: ['hundred-one']}
      ]
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {worker: false, parquet: {pageSize: 2, pageIndex: {id: true, tags: true}}}
  );
  const file = new BlobFile(new Blob([parquetBuffer]));
  const reader = new ParquetReader(file);
  const metadata = await reader.getFileMetadata();
  const schema = await reader.getSchema();
  const rowGroup = metadata.row_groups[0];
  const selectedColumnPaths = rowGroup.columns.map(column => column.meta_data!.path_in_schema);
  const plan = await createParquetPagePruningPlan(
    file,
    rowGroup,
    schema,
    selectedColumnPaths,
    {op: '>=', args: [{property: 'id'}, 100]}
  );
  expect(plan?.selectedPageCount).toBe(2);
  const selectedRowGroup = await reader.readRowGroupRange(
    schema,
    rowGroup,
    [],
    plan!.rowRanges[0],
    plan!.pageLocations
  );
  const repeatedColumn = Object.entries(selectedRowGroup.columnData).find(([path]) =>
    path.includes('tags')
  )?.[1];
  expect(
    repeatedColumn?.values.map(value => new TextDecoder().decode(value as Uint8Array))
  ).toEqual(['hundred', 'hundred-one']);
  await file.close();
});
