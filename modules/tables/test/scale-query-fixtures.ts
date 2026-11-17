// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {CSVTableSource} from '@loaders.gl/tables/csv';
import {ArrowTableSource} from '@loaders.gl/tables/arrow';
import {ParquetSource} from '@loaders.gl/tables/parquet-source';
import {ParquetWriter} from '@loaders.gl/tables/parquet';

/** Builds equivalent in-memory Arrow, CSV, and Parquet sources with configurable chunk sizes. */
export async function createScaleQuerySources(rowCount: number, batchSize: number) {
  const rows = Array.from({length: rowCount}, (_, id) => ({
    id,
    value: id > 0 && id % 23 === 0 ? null : id % 191,
    label: `row-${id}`
  }));
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
  const batches = [];
  for (let offset = 0; offset < rowCount; offset += batchSize) {
    batches.push(...table.slice(offset, offset + batchSize).batches);
  }
  const arrowIPC = arrow.tableToIPC(new arrow.Table(table.schema, batches), 'stream');
  const csv = [
    'id,value,label\n',
    ...rows.map(row => `${row.id},${row.value ?? ''},${row.label}\n`)
  ];
  const parquet = await ParquetWriter.encode(
    {shape: 'object-row-table', schema: convertArrowToSchema(table.schema), data: rows},
    {parquet: {rowGroupSize: batchSize, writeStatistics: true}}
  );
  return {
    arrow: new ArrowTableSource(new Blob([new Uint8Array(arrowIPC)])),
    csv: new CSVTableSource(new Blob(csv), {core: {batchSize}}),
    parquet: new ParquetSource(new Blob([parquet]), {core: {batchSize, worker: false}})
  };
}
