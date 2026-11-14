// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {TableQuery} from '@loaders.gl/core/scan';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import {CSVTableSource} from '@loaders.gl/tables/csv/index';
import {NDJSONTableSource} from '@loaders.gl/tables/json/index';
import {ArrowTableSource} from '@loaders.gl/tables/arrow/index';
import {ParquetSource} from '@loaders.gl/tables/parquet-source-loader';
import {ParquetJSWriter} from '@loaders.gl/tables/parquet/index';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';

/** Adds hermetic cross-format query benchmarks with identical logical input. */
export default async function queryBench(suite) {
  const rowCount = 4096;
  const benchmarkOptions = {
    iterations: undefined,
    time: 100,
    minIterations: 3,
    maxTimeMs: 1000,
    unit: 'queries'
  };
  const rows = Array.from({length: rowCount}, (_, id) => ({id, value: id % 2, label: `row-${id}`}));
  const table = new arrow.Table({
    id: arrow.vectorFromArray(
      rows.map(row => row.id),
      new arrow.Float64()
    ),
    value: arrow.vectorFromArray(
      rows.map(row => row.value),
      new arrow.Float64()
    ),
    label: arrow.vectorFromArray(
      rows.map(row => row.label),
      new arrow.Utf8()
    )
  });
  const parquet = await ParquetJSWriter.encode(
    {shape: 'object-row-table', schema: convertArrowToSchema(table.schema), data: rows},
    {parquet: {rowGroupSize: 256, writeStatistics: true}}
  );
  const sources = {
    csv: new CSVTableSource(
      new Blob(['id,value,label\n', ...rows.map(row => `${row.id},${row.value},${row.label}\n`)]),
      {core: {batchSize: 256}}
    ),
    ndjson: new NDJSONTableSource(new Blob(rows.map(row => `${JSON.stringify(row)}\n`)), {
      core: {batchSize: 256}
    }),
    arrow: new ArrowTableSource(
      new Blob([
        new Uint8Array(arrow.tableToIPC(table.slice(0, 2048).concat(table.slice(2048)), 'stream'))
      ])
    ),
    parquet: new ParquetSource(new Blob([parquet]), {core: {worker: false}})
  };
  const scenarios: Record<string, TableQuery> = {
    'all-pass': {select: ['label'], where: {op: '>=', args: [{property: 'id'}, 0]}},
    'all-reject': {select: ['label'], where: {op: '<', args: [{property: 'id'}, 0]}},
    contiguous: {select: ['label'], where: {op: '<', args: [{property: 'id'}, 2048]}},
    scattered: {select: ['label'], where: {op: '=', args: [{property: 'value'}, 1]}},
    limit: {select: ['label'], where: {op: '=', args: [{property: 'value'}, 1]}, limit: 10}
  };
  const group = suite.group('Query: 4096 input rows, warm metadata, in-memory bytes');
  for (const [format, source] of Object.entries(sources)) {
    await source.getQueryMetadata();
    for (const [name, request] of Object.entries(scenarios)) {
      group.addAsync(`${format} ${name} collect`, benchmarkOptions, async () => {
        return (await query(request, {source})).numRows;
      });
      group.addAsync(`${format} ${name} stream`, benchmarkOptions, async () => {
        let count = 0;
        for await (const batch of queryInBatches(request, {source})) count += batch.numRows;
        return count;
      });
    }
  }
}
