// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  createScanQueryMetadata,
  DataSource,
  DataSourceManager,
  type DataSourceOptions,
  type ScanQueryMetadata,
  type TableScanReadOptions,
  type TableScanSource
} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {SQLPredicate} from '@loaders.gl/sql';
import {FederatedTableScanSource, parseSQLPredicate} from '@loaders.gl/scan';

test('FederatedTableScanSource has matching Node and browser execution semantics', async () => {
  const dataSourceManager = new DataSourceManager();
  dataSourceManager.add({
    dataSourceId: 'memory',
    dataSource: new CrossRuntimeTableSource()
  });
  const source = new FederatedTableScanSource(dataSourceManager, {
    sources: [{dataSourceId: 'memory'}]
  });

  expect((await source.getQueryMetadata()).columns.map(column => column.name)).toEqual([
    'id',
    'score'
  ]);
  expect((await source.explain({columns: ['id']})).plan.map(step => step.kind)).toEqual([
    'scan',
    'project'
  ]);

  const rows: unknown[] = [];
  for await (const batch of source.read({
    predicate: parseSQLPredicate('score >= 20'),
    columns: ['id']
  })) {
    rows.push(...batch.data.toArray().map(row => row?.toJSON()));
  }
  expect(rows).toEqual([{id: 2}]);
});

/** Minimal Arrow source used to execute the public federation contract in both runtimes. */
class CrossRuntimeTableSource
  extends DataSource<string, DataSourceOptions>
  implements TableScanSource<ArrowTableBatch, SQLPredicate>
{
  /** Immutable in-memory Arrow table emitted by this source. */
  private readonly table: ArrowTable;

  /** Creates the deterministic two-row fixture. */
  constructor() {
    super('memory', {});
    const data = arrow.tableFromArrays({id: [1, 2], score: [10, 20]});
    this.table = {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
  }

  /** Reports the fixture schema without consuming rows. */
  async getQueryMetadata(): Promise<ScanQueryMetadata> {
    return createScanQueryMetadata({
      sourceType: 'memory',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema: this.table.schema!,
      capabilities: {
        table: {
          predicate: 'unsupported',
          projection: 'unsupported',
          limit: 'unsupported',
          streaming: true,
          cancellation: true
        }
      },
      statistics: {rowCount: this.table.data.numRows}
    });
  }

  /** Emits the fixture as one physical batch for residual federation execution. */
  async *read(_options: TableScanReadOptions<SQLPredicate> = {}): AsyncIterable<ArrowTableBatch> {
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema: this.table.schema,
      data: this.table.data,
      length: this.table.data.numRows
    };
  }
}
