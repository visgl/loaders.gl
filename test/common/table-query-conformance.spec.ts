// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

import {encode} from '@loaders.gl/core';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetDatasetSource} from '@loaders.gl/parquet/parquet-dataset-source';
import {queryArrowTable} from '@loaders.gl/sql/arrow-query';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

test('Arrow and Parquet execute one portable projection, predicate, and limit consistently', async () => {
  const rows = [
    {name: 'one', score: 1},
    {name: 'unknown', score: null},
    {name: 'three', score: 3},
    {name: 'four', score: 4}
  ];
  const query = {
    columns: ['name'],
    predicate: {op: '>=', args: [{property: 'score'}, 3]},
    limit: 2
  } as const;
  const arrowData = arrow.tableFromArrays({
    name: rows.map(row => row.name),
    score: rows.map(row => row.score)
  });
  const arrowTable: ArrowTable = {
    shape: 'arrow-table',
    schema: convertArrowToSchema(arrowData.schema),
    data: arrowData
  };

  const parquetSource = new ParquetDatasetSource(
    [
      {data: await encodeParquetRows(rows.slice(0, 3))},
      {data: await encodeParquetRows(rows.slice(3))}
    ],
    {core: {worker: false}}
  );
  const parquetRows: Array<Record<string, unknown>> = [];
  for await (const batch of parquetSource.read(query)) {
    parquetRows.push(...batch.data.toArray().map(row => row.toJSON()));
  }

  expect(
    queryArrowTable(arrowTable, query)
      .data.toArray()
      .map(row => row.toJSON())
  ).toEqual(parquetRows);
  expect(parquetRows).toEqual([{name: 'three'}, {name: 'four'}]);
  await parquetSource.close();
});

/** Encodes a deterministic nullable fixture for portable query conformance. */
async function encodeParquetRows(rows: Array<{name: string; score: number | null}>): Promise<Blob> {
  const data = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'name', type: 'utf8', nullable: false},
          {name: 'score', type: 'int32', nullable: true}
        ],
        metadata: {}
      },
      data: rows
    } satisfies ObjectRowTable,
    ParquetJSWriter
  );
  return new Blob([data]);
}
