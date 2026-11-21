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
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {SQLPredicate} from '@loaders.gl/core/query';
import {FederatedTableScanSource, parseSQLPredicate} from '@loaders.gl/core/query';

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
    rows.push(...batch.toArray().map(row => row?.toJSON()));
  }
  expect(rows).toEqual([{id: 2}]);
});

/** Minimal Arrow source used to execute the public federation contract in both runtimes. */
class CrossRuntimeTableSource
  extends DataSource<string, DataSourceOptions>
  implements TableScanSource<arrow.RecordBatch, SQLPredicate>
{
  /** Immutable in-memory Arrow table emitted by this source. */
  private readonly table: arrow.Table;

  /** Creates the deterministic two-row fixture. */
  constructor() {
    super('memory', {});
    const data = arrow.tableFromArrays({id: [1, 2], score: [10, 20]});
    this.table = data;
  }

  /** Reports the fixture schema without consuming rows. */
  async getQueryMetadata(): Promise<ScanQueryMetadata> {
    return createScanQueryMetadata({
      sourceType: 'memory',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema: convertArrowToSchema(this.table.schema),
      capabilities: {
        table: {
          predicate: 'unsupported',
          projection: 'unsupported',
          limit: 'unsupported',
          streaming: true,
          cancellation: true
        }
      },
      statistics: {rowCount: this.table.numRows}
    });
  }

  /** Emits the fixture as one physical batch for residual federation execution. */
  async *read(_options: TableScanReadOptions<SQLPredicate> = {}): AsyncIterable<arrow.RecordBatch> {
    yield* this.table.batches;
  }
}
